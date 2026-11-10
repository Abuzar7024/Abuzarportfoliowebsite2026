/**
 * Comprehensive verification suite for the National AI Hackathon (Bhopal) system.
 * Tests all mandatory scenarios from Section 11 against shared pricing/validation,
 * live database + service layer, PayU callback/verification handlers, and Admin CSV export.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import postgres from "postgres";
import { createServer } from "vite";

// Load .env.local
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function makeMember(i, prefix = "test") {
  const pad = String(i).padStart(2, "0");
  return {
    fullName: `Participant ${i} Sharma`,
    email: `${prefix}.member${i}@example.org`,
    mobile: `+91 98765432${pad}`,
    organisation: "MANIT Bhopal",
    course: i === 1 ? "B.Tech CSE (Final Year)" : "B.Tech AI & DS",
    github: `https://github.com/${prefix}user${i}`,
    linkedin: `https://www.linkedin.com/in/${prefix}user${i}`,
    skills: i === 1 ? "Full-Stack & LLM Agents" : "Computer Vision",
  };
}

function computePayuReverseHash({ key, salt, status, txnid, amount, productinfo, firstname, email, udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "" }) {
  const str = [
    salt,
    status,
    "",
    "",
    "",
    "",
    "",
    udf5,
    udf4,
    udf3,
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ].join("|");
  return crypto.createHash("sha512").update(str).digest("hex").toLowerCase();
}

async function main() {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const { computeFee, DEFAULT_PRICING, validateMemberCount, formatInr } = await vite.ssrLoadModule("/src/shared/hackathon-pricing.ts");
  const { validateTeamInput, MAX_TEAM_SIZE_MESSAGE } = await vite.ssrLoadModule("/src/shared/hackathon-validation.ts");
  const { DEFAULT_CONTENT, EVENT_STATUS_LABELS } = await vite.ssrLoadModule("/src/shared/hackathon-content.ts");
  const passMod = await vite.ssrLoadModule("/src/hackathon/HackathonPass.tsx");
  const { generateQrMatrix } = await vite.ssrLoadModule("/src/competition/qr-code.ts");
  const {
    registerTeam,
    initiatePayment,
    handlePayuCallback,
    getPayment,
    getTeam,
    getMembers,
    buildEmailPayloads,
  } = await vite.ssrLoadModule("/src/server/hackathon/service.ts");
  const { createHackathonHandler, sanitizeContent } = await vite.ssrLoadModule("/src/server/hackathon/api.ts");
  const { getSql, closeSql } = await vite.ssrLoadModule("/src/server/hackathon/db.ts");

  try {
    console.log("=== 0. AVATAR Rebranding, Pre-Registration Announcement, Navigation & Pass QR Verification ===");
    assert.equal(DEFAULT_CONTENT.settings.eventName, "AVATAR", "Event name must be AVATAR");
    assert.equal(DEFAULT_CONTENT.settings.editionLabel, "DESIGN. BUILD. SELL. IN ONE DAY.");
    assert.equal(DEFAULT_CONTENT.home.heroHeadline, "DESIGN. BUILD. SELL. IN ONE DAY.");
    assert.equal(DEFAULT_CONTENT.home.ctaHeadline, "PRE-REGISTRATIONS ARE NOW OPEN!");
    assert.equal(DEFAULT_CONTENT.settings.maxTeamSize, 15, "Default maxTeamSize must be 15");
    assert.equal(DEFAULT_PRICING.maxTeamSize, 15, "DEFAULT_PRICING.maxTeamSize must be 15");
    assert.equal(
      /5,?000\s*pre-?registrations?/i.test(JSON.stringify(DEFAULT_CONTENT)),
      false,
      "All 5,000 pre-registration references must be removed from content"
    );
    const uiSource = fs.readFileSync("src/hackathon/ui.tsx", "utf8");
    assert.equal(/\bSign in\b/i.test(uiSource), false, "Sign In must be completely removed from navigation");
    assert.equal(uiSource.includes("HACKATHON STATUS"), true, "HACKATHON STATUS navigation item must be present");
    assert.equal(uiSource.includes("/competition/status"), true, "HACKATHON STATUS link must point to /competition/status");
    assert.equal(uiSource.includes("Back to Portfolio"), true, "Back to Portfolio button must be present in navbar");
    assert.equal(uiSource.includes("https://abuzarcode.in/"), true, "Back to Portfolio button must use https://abuzarcode.in/");
    assert.equal(uiSource.includes('data-testid="back-to-portfolio-btn"'), true, "Navbar Back to Portfolio button must be present");
    assert.equal(uiSource.includes('data-testid="navbar-logo"'), true, "Compact navbar logo must be present");
    for (const file of [
      "src/hackathon/ui.tsx",
      "src/hackathon/HomePage.tsx",
      "src/hackathon/RegisterFlow.tsx",
      "src/hackathon/StatusPage.tsx",
      "src/hackathon/PaymentPage.tsx",
      "src/hackathon/PolicyPage.tsx",
      "src/hackathon/AdminPage.tsx",
    ]) {
      const src = fs.readFileSync(file, "utf8");
      assert.equal(
        /max-w-\[(1200|1140|900|860|780|760)px\]/.test(src),
        false,
        `${file} must use full-width responsive containers instead of narrow fixed max-w containers`
      );
    }
    const regSource = fs.readFileSync("src/hackathon/RegisterFlow.tsx", "utf8");
    assert.equal(regSource.includes("Participation mode"), false, "Participation Mode must be removed from RegisterFlow");
    assert.equal(regSource.includes('label="City"'), false, "City field must be removed from RegisterFlow");
    assert.equal(regSource.includes('label="State"'), false, "State field must be removed from RegisterFlow");
    assert.equal(passMod.PASS_QR_URL, "https://abuzarcode.in/", "Pass QR code must redirect to https://abuzarcode.in/");
    assert.equal(typeof passMod.HackathonPassCard, "function", "HackathonPassCard must remain intact");
    assert.equal(typeof passMod.downloadPassPng, "function", "downloadPassPng must remain intact");
    assert.equal(passMod.DemoPassShowcase, undefined, "DemoPassShowcase must be removed");
    assert.equal(passMod.PreRegistrationProgressSection, undefined, "PreRegistrationProgressSection must be removed");
    const qrMatrix = generateQrMatrix(passMod.PASS_QR_URL);
    assert.ok(Array.isArray(qrMatrix) && qrMatrix.length >= 21, "QR matrix for https://abuzarcode.in/ must be valid");
    console.log("  [PASS] AVATAR branding, Sign In removal, HACKATHON STATUS nav, Mode/City/State removal & QR URL verified\n");
    console.log("=== 1. Mandatory Pricing Scenarios (₹499 per person, 1–15 members) ===");
    const pricing = { ...DEFAULT_PRICING, maxTeamSize: 15 };

    const f1 = computeFee(1, pricing);
    assert.equal(f1.total, 499, "1-member team must be ₹499");
    assert.equal(formatInr(f1.total), "₹499");
    console.log("  [PASS] 1-member team ->", formatInr(f1.total));

    const f2 = computeFee(2, pricing);
    assert.equal(f2.total, 998, "2-member team must be ₹998");
    assert.equal(formatInr(f2.total), "₹998");
    console.log("  [PASS] 2-member team ->", formatInr(f2.total));

    const f4 = computeFee(4, pricing);
    assert.equal(f4.total, 1996, "4-member team must be ₹1,996");
    assert.equal(formatInr(f4.total), "₹1,996");
    console.log("  [PASS] 4-member team ->", formatInr(f4.total));

    const f10 = computeFee(10, pricing);
    assert.equal(f10.total, 4990, "10-member team must be ₹4,990");
    assert.equal(formatInr(f10.total), "₹4,990");
    console.log("  [PASS] 10-member team ->", formatInr(f10.total));

    const f15 = computeFee(15, pricing);
    assert.equal(f15.total, 7485, "15-member team must be ₹7,485");
    assert.equal(formatInr(f15.total), "₹7,485");
    console.log("  [PASS] 15-member team ->", formatInr(f15.total));

    assert.equal(validateMemberCount(0, pricing), null, "0 members must be rejected");
    assert.equal(validateMemberCount(16, pricing), null, "16 members must be rejected");
    assert.equal(validateMemberCount("15", pricing), 15, "String '15' coerced to 15");

    console.log("\n=== 2. Dynamic Team Size (Max 15) & Input Validation Without Mode/City/State ===");
    const membersState = [makeMember(1, "dyn"), makeMember(2, "dyn"), makeMember(3, "dyn"), makeMember(4, "dyn")];
    const shrunk = membersState.slice(0, 2);
    assert.equal(shrunk.length, 2);
    assert.equal(shrunk[0].fullName, "Participant 1 Sharma");
    assert.equal(shrunk[1].fullName, "Participant 2 Sharma");
    console.log("  [PASS] Decreasing team size preserves existing member details");

    const valOpts = { maxTeamSize: 15 };

    // Reject 16th participant with exact message: "A team can have a maximum of 15 members."
    const tooManyRes = validateTeamInput(
      {
        teamName: "Oversized Team",
        organisation: "MANIT Bhopal",
        referralCode: "",
        memberCount: 16,
        consent: true,
        members: Array.from({ length: 16 }, (_, idx) => makeMember(idx + 1, "over16")),
      },
      valOpts
    );
    assert.equal(tooManyRes.ok, false, "16 members must fail validation");
    assert.equal(
      tooManyRes.errors.memberCount,
      "A team can have a maximum of 15 members.",
      "Exact 16-member error message must match requirement"
    );
    assert.equal(MAX_TEAM_SIZE_MESSAGE, "A team can have a maximum of 15 members.");
    console.log("  [PASS] 16th participant rejected with exact message:", tooManyRes.errors.memberCount);

    // Reject invalid email
    const badEmailRes = validateTeamInput(
      {
        teamName: "Invalid Email Team",
        organisation: "MANIT Bhopal",
        referralCode: "",
        memberCount: 1,
        consent: true,
        members: [{ ...makeMember(1, "bademail"), email: "not-an-email" }],
      },
      valOpts
    );
    assert.equal(badEmailRes.ok, false, "Invalid email must fail validation");
    assert.ok(badEmailRes.errors["members.0.email"], "Field error on members.0.email must be present");
    console.log("  [PASS] Invalid email rejected:", badEmailRes.errors["members.0.email"]);

    // Reject invalid mobile number
    const badMobileRes = validateTeamInput(
      {
        teamName: "Invalid Mobile Team",
        organisation: "MANIT Bhopal",
        referralCode: "",
        memberCount: 1,
        consent: true,
        members: [{ ...makeMember(1, "badmob"), mobile: "12345" }],
      },
      valOpts
    );
    assert.equal(badMobileRes.ok, false, "Invalid mobile number must fail validation");
    assert.ok(badMobileRes.errors["members.0.mobile"], "Field error on members.0.mobile must be present");
    console.log("  [PASS] Invalid mobile rejected:", badMobileRes.errors["members.0.mobile"]);

    // Reject duplicate email within the same team
    const dupMemberRes = validateTeamInput(
      {
        teamName: "Dup Member Team",
        organisation: "MANIT Bhopal",
        referralCode: "",
        memberCount: 2,
        consent: true,
        members: [makeMember(1, "dup"), { ...makeMember(2, "dup"), email: makeMember(1, "dup").email }],
      },
      valOpts
    );
    assert.equal(dupMemberRes.ok, false, "Duplicate member email in same team must fail");
    console.log("  [PASS] Duplicate email within same team rejected");

    console.log("\n=== 3. Database & End-to-End Registration + Payment Lifecycle ===");
    const sql = getSql();
    const runId = `t${Date.now().toString(36)}`;
    const createdTeamIds = [];
    const adminEmail = `admin.${runId}@example.org`;
    const content = structuredClone(DEFAULT_CONTENT);
    content.settings.maxTeamSize = 15;
    content.settings.registrationOpen = true;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const ref = (supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
    async function cleanupTestRows() {
      const adminDb = postgres({
        host: `db.${ref}.supabase.co`,
        port: 5432,
        database: "postgres",
        username: "postgres",
        password: process.env.SUPABASE_DB_PASSWORD,
        ssl: "require",
        max: 1,
      });
      try {
        await adminDb`DELETE FROM hk_refunds WHERE payment_id IN (SELECT p.id FROM hk_payments p JOIN hk_teams t ON t.id = p.team_id WHERE t.name LIKE 'Bhopal Innovators S%')`;
        await adminDb`DELETE FROM hk_payment_events WHERE txnid IN (SELECT p.txnid FROM hk_payments p JOIN hk_teams t ON t.id = p.team_id WHERE t.name LIKE 'Bhopal Innovators S%')`;
        await adminDb`DELETE FROM hk_payments WHERE team_id IN (SELECT id FROM hk_teams WHERE name LIKE 'Bhopal Innovators S%')`;
        await adminDb`DELETE FROM hk_change_requests WHERE team_id IN (SELECT id FROM hk_teams WHERE name LIKE 'Bhopal Innovators S%')`;
        await adminDb`DELETE FROM hk_participants WHERE team_id IN (SELECT id FROM hk_teams WHERE name LIKE 'Bhopal Innovators S%')`;
        await adminDb`DELETE FROM hk_teams WHERE name LIKE 'Bhopal Innovators S%'`;
        await adminDb`DELETE FROM hk_audit_logs WHERE actor LIKE 'admin.t%@example.org'`;
        await adminDb`DELETE FROM hk_admin_users WHERE email LIKE 'admin.t%@example.org'`;
        const [{ n }] = await adminDb`SELECT COUNT(*)::int AS n FROM hk_teams`;
        if (n === 0) {
          await adminDb`ALTER SEQUENCE public.hk_team_seq RESTART WITH 1`;
          await adminDb`ALTER SEQUENCE public.hk_reg_seq RESTART WITH 1`;
        }
      } finally {
        await adminDb.end();
      }
    }

    await cleanupTestRows();

    try {
      await sql`INSERT INTO hk_admin_users (email, role) VALUES (${adminEmail}, 'ADMIN') ON CONFLICT (email) DO NOTHING`;

      // 3A. Test server-side fee calculation & registration without Mode/City/State for 1, 2, 4, 10, and 15 member teams
      for (const [size, expectedTotal] of [
        [1, 499],
        [2, 998],
        [4, 1996],
        [10, 4990],
        [15, 7485],
      ]) {
        const membersRaw = Array.from({ length: size }, (_, idx) => {
          const m = makeMember(idx + 1, `${runId}s${size}`);
          m.mobile = `+91 9${String(size).padStart(2, "0")}65432${String(idx + 1).padStart(2, "0")}`;
          return m;
        });
        const v = validateTeamInput(
          {
            teamName: `Bhopal Innovators S${size} ${runId}`,
            organisation: "MANIT Bhopal",
            referralCode: "",
            memberCount: size,
            consent: true,
            members: membersRaw,
          },
          valOpts
        );
        assert.equal(v.ok, true, `Validation failed for ${size}-member team`);
        const reg = await registerTeam(v.value, content, { origin: "https://abuzarcode.in", sandbox: false });
        createdTeamIds.push(reg.teamId);
        assert.equal(reg.fee.total, expectedTotal, `Server total for ${size} members must be ₹${expectedTotal}`);
        console.log(`  [PASS] Server DB registration created (no mode/city/state) for ${size}-member team -> ₹${reg.fee.total}`);
      }

      // 3B. Test payment failure does NOT create a paid/confirmed registration
      const failTeamId = createdTeamIds[0]; // 1-member team (₹499)
      const failInit = await initiatePayment(failTeamId, content, { origin: "https://abuzarcode.in", sandbox: false });
      assert.equal(failInit.alreadyPaid, false);
      assert.equal(failInit.checkout.fee.total, 499);
      const failTxnId = failInit.checkout.txnid;
      const fieldsF = failInit.checkout.fields;

      const key = process.env.PAYU_MERCHANT_KEY;
      const salt = process.env.PAYU_MERCHANT_SALT;
      const failHash = computePayuReverseHash({
        key,
        salt,
        status: "failure",
        txnid: failTxnId,
        amount: fieldsF.amount,
        productinfo: fieldsF.productinfo,
        firstname: fieldsF.firstname,
        email: fieldsF.email,
        udf1: fieldsF.udf1,
        udf2: fieldsF.udf2,
        udf3: fieldsF.udf3,
      });
      await handlePayuCallback(
        {
          key,
          txnid: failTxnId,
          mihpayid: `MIH_FAIL_${runId}`,
          status: "failure",
          amount: fieldsF.amount,
          productinfo: fieldsF.productinfo,
          firstname: fieldsF.firstname,
          email: fieldsF.email,
          udf1: fieldsF.udf1,
          udf2: fieldsF.udf2,
          udf3: fieldsF.udf3,
          error_Message: "Bank declined transaction",
          hash: failHash,
        },
        { origin: "https://abuzarcode.in", localOrigin: false }
      );
      const failPayRow = await getPayment(failTxnId);
      const failTeamRow = await getTeam(failTeamId);
      assert.equal(failPayRow.status, "FAILED", "Failed callback must mark payment as FAILED");
      assert.notEqual(failTeamRow.status, "CONFIRMED", "Failed payment must NOT confirm team");
      assert.equal(failTeamRow.team_code, null, "Failed payment must NOT mint a Team ID");
      console.log("  [PASS] Payment failure does NOT create a confirmed registration or mint IDs");

      // 3B-2. Test Retry Payment after failure (reuses same team without duplicate registration) & Pending Payment state
      const retryInit = await initiatePayment(failTeamId, content, { origin: "https://abuzarcode.in", sandbox: false });
      assert.equal(retryInit.alreadyPaid, false, "Retry after failed payment must issue a new checkout");
      assert.notEqual(retryInit.checkout.txnid, failTxnId, "Retry must generate a fresh unique txnid");
      const pendingTxnId = retryInit.checkout.txnid;
      const fieldsP = retryInit.checkout.fields;
      const pendingHash = computePayuReverseHash({
        key,
        salt,
        status: "pending",
        txnid: pendingTxnId,
        amount: fieldsP.amount,
        productinfo: fieldsP.productinfo,
        firstname: fieldsP.firstname,
        email: fieldsP.email,
        udf1: fieldsP.udf1,
        udf2: fieldsP.udf2,
        udf3: fieldsP.udf3,
      });
      await handlePayuCallback(
        {
          key,
          txnid: pendingTxnId,
          mihpayid: `MIH_PEND_${runId}`,
          status: "pending",
          amount: fieldsP.amount,
          productinfo: fieldsP.productinfo,
          firstname: fieldsP.firstname,
          email: fieldsP.email,
          udf1: fieldsP.udf1,
          udf2: fieldsP.udf2,
          udf3: fieldsP.udf3,
          hash: pendingHash,
        },
        { origin: "https://abuzarcode.in", localOrigin: false }
      );
      const pendingPayRow = await getPayment(pendingTxnId);
      const pendingTeamRow = await getTeam(failTeamId);
      assert.equal(pendingPayRow.status, "PENDING", "Pending callback must mark payment as PENDING");
      assert.notEqual(pendingTeamRow.status, "CONFIRMED", "Pending payment must NOT mark registration as confirmed");
      assert.equal(pendingTeamRow.team_code, null, "Pending payment must NOT mint a Team ID or pass yet");
      console.log("  [PASS] Retry payment after failure & Pending payment (PAYMENT PROCESSING) state verified");

      // 3C. Test successful payment on 4-member team (₹1,996), Team Leader identification, and repeated callbacks idempotency
      const team4Id = createdTeamIds[2]; // 4-member team (₹1,996)
      const succInit = await initiatePayment(team4Id, content, { origin: "https://abuzarcode.in", sandbox: false });
      assert.equal(succInit.alreadyPaid, false);
      assert.equal(succInit.checkout.fee.total, 1996);
      const succTxnId = succInit.checkout.txnid;
      const fieldsS = succInit.checkout.fields;

      const origFetch = globalThis.fetch;
      globalThis.fetch = async (url, opts) => {
        if (String(url).includes("payu.in/merchant/postservice")) {
          return new Response(
            JSON.stringify({
              status: 1,
              msg: "1 out of 1 Transactions Fetched Successfully",
              transaction_details: {
                [succTxnId]: {
                  mihpayid: `MIH_OK_${runId}`,
                  txnid: succTxnId,
                  status: "success",
                  amt: "1996.00",
                  transaction_amount: "1996.00",
                  mode: "UPI",
                  bank_ref_num: "432198765432",
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        return origFetch(url, opts);
      };

      try {
        const succHash = computePayuReverseHash({
          key,
          salt,
          status: "success",
          txnid: succTxnId,
          amount: fieldsS.amount,
          productinfo: fieldsS.productinfo,
          firstname: fieldsS.firstname,
          email: fieldsS.email,
          udf1: fieldsS.udf1,
          udf2: fieldsS.udf2,
          udf3: fieldsS.udf3,
        });
        const callbackPayload = {
          key,
          txnid: succTxnId,
          mihpayid: `MIH_OK_${runId}`,
          status: "success",
          mode: "UPI",
          bank_ref_num: "432198765432",
          amount: fieldsS.amount,
          productinfo: fieldsS.productinfo,
          firstname: fieldsS.firstname,
          email: fieldsS.email,
          udf1: fieldsS.udf1,
          udf2: fieldsS.udf2,
          udf3: fieldsS.udf3,
          hash: succHash,
        };

        await handlePayuCallback(callbackPayload, { origin: "https://abuzarcode.in", localOrigin: false });
        const pay1 = await getPayment(succTxnId);
        const team1 = await getTeam(team4Id);
        const members1 = await getMembers(team4Id);

        assert.equal(pay1.status, "SUCCESS");
        assert.equal(team1.status, "CONFIRMED");
        assert.match(team1.team_code ?? "", /^AIH-T-\d{6}$/, "Confirmed team must receive AIH-T-XXXXXX");
        assert.equal(members1.length, 4);

        // Verify Team Leader is correctly identified (first member = leader, others = non-leader)
        const leader = members1[0];
        assert.equal(leader.is_leader, true, "First participant must be Team Leader");
        for (let i = 0; i < members1.length; i++) {
          assert.match(members1[i].registration_code ?? "", /^AIH-R-\d{6}$/, "Each member must receive AIH-R-XXXXXX");
          if (i > 0) assert.equal(members1[i].is_leader, false, `Participant ${i + 1} must not be marked leader`);
        }
        console.log(
          `  [PASS] 4-member payment confirmed -> Team ${team1.team_code}, Leader=${leader.full_name} (${leader.registration_code})`
        );

        // Verify confirmation email payload contains AVATAR branding, Registration ID, Transaction ID, and https://abuzarcode.in/
        const emailPayloads = buildEmailPayloads(team1, members1, pay1, "https://abuzarcode.in");
        assert.ok(emailPayloads.leader.subject.includes("AVATAR"), "Leader email subject must include AVATAR");
        assert.ok(emailPayloads.leader.message.includes("PAYMENT SUCCESSFUL!"), "Leader email message must include PAYMENT SUCCESSFUL!");
        assert.ok(emailPayloads.leader.message.includes(leader.registration_code), "Leader email must include Registration ID");
        assert.ok(emailPayloads.leader.message.includes(succTxnId), "Leader email must include Transaction ID");
        assert.ok(emailPayloads.leader.message.includes("https://abuzarcode.in/"), "Leader email must include https://abuzarcode.in/");
        console.log("  [PASS] Confirmation email payload verified (AVATAR, Registration ID, Transaction ID, Pass link)");

        // Repeated payment callback (same gateway callback delivered 3 times)
        await handlePayuCallback(callbackPayload, { origin: "https://abuzarcode.in", localOrigin: false });
        await handlePayuCallback(callbackPayload, { origin: "https://abuzarcode.in", localOrigin: false });
        const teamAfterRepeat = await getTeam(team4Id);
        const membersAfterRepeat = await getMembers(team4Id);
        assert.equal(teamAfterRepeat.team_code, team1.team_code, "Repeated callback must preserve identical Team ID");
        assert.deepEqual(
          membersAfterRepeat.map((m) => m.registration_code),
          members1.map((m) => m.registration_code),
          "Repeated callback must not re-mint or duplicate member Registration IDs"
        );
        const [{ count: teamCount }] = await sql`SELECT COUNT(*)::int AS count FROM hk_teams WHERE id = ${team4Id}`;
        assert.equal(teamCount, 1, "Must still be exactly 1 team row");
        console.log("  [PASS] Repeated payment callbacks are 100% idempotent (zero duplicate registrations)");

        // 3D. Verify Admin API Overview & CSV Export over HTTP
        const testBearer = "test-admin-access-token-1234567890";
        const apiHandler = createHackathonHandler({
          verifyToken: async (token) => (token === testBearer ? { email: adminEmail } : null),
        });
        const srv = http.createServer((req, res) => apiHandler(req, res));
        await new Promise((r) => srv.listen(0, "127.0.0.1", r));
        const port = srv.address().port;
        try {
          const ovRes = await origFetch(`http://127.0.0.1:${port}/api/hackathon/admin/overview`, {
            headers: { authorization: `Bearer ${testBearer}` },
          });
          const ovData = await ovRes.json();
          assert.equal(ovRes.status, 200, `Expected 200 on admin/overview, got ${ovRes.status}: ${JSON.stringify(ovData)}`);
          assert.equal(ovData.ok, true);
          assert.ok(ovData.totals.teams >= 1, "Admin overview must reflect confirmed team");
          assert.ok(ovData.totals.participants >= 4, "Admin overview must reflect confirmed participants");

          const csvRes = await origFetch(`http://127.0.0.1:${port}/api/hackathon/admin/registrations.csv?q=${encodeURIComponent(runId)}`, {
            headers: { authorization: `Bearer ${testBearer}` },
          });
          assert.equal(csvRes.status, 200);
          const csvText = await csvRes.text();
          assert.ok(csvText.includes(team1.team_code), "Admin CSV export must include confirmed Team ID");
          assert.ok(csvText.includes(leader.registration_code), "Admin CSV export must include member Registration ID");
          console.log("  [PASS] Admin overview, search filter, and CSV export verified over HTTP");

          // 3E. Verify Public Hackathon Status API & Dynamic Status Updates without login
          const pubContentRes = await origFetch(`http://127.0.0.1:${port}/api/hackathon/content`);
          assert.equal(pubContentRes.status, 200);
          const pubContent = await pubContentRes.json();
          assert.equal(pubContent.ok, true);
          assert.equal(pubContent.content.settings.eventName, "AVATAR");
          assert.equal(pubContent.content.settings.maxTeamSize, 15);
          assert.equal(pubContent.content.settings.eventStatus, "Pre-Registrations Open");
          assert.ok(pubContent.stats.confirmedTeams >= 1, "Public status API must report confirmedTeams without login");
          assert.ok(pubContent.stats.confirmedParticipants >= 4, "Public status API must report confirmedParticipants without login");
          for (const statusLabel of EVENT_STATUS_LABELS) {
            const sanitized = sanitizeContent("settings", { eventStatus: statusLabel }, content);
            assert.equal(sanitized.eventStatus, statusLabel, `Admin sanitizeContent must support ${statusLabel}`);
          }
          console.log("  [PASS] Public Hackathon Status API & all 6 dynamic Event Status indicators verified without login");

          // 3F. Verify direct API rejection of 16-member team over HTTP
          const over16HttpRes = await origFetch(`http://127.0.0.1:${port}/api/hackathon/register`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              teamName: `Oversized HTTP Team ${runId}`,
              memberCount: 16,
              consent: true,
              members: Array.from({ length: 16 }, (_, idx) => makeMember(idx + 1, `http16_${runId}`)),
            }),
          });
          assert.equal(over16HttpRes.status, 400, "Direct API request with 16 members must be rejected with HTTP 400");
          const over16Json = await over16HttpRes.json();
          assert.equal(over16Json.fields?.memberCount, "A team can have a maximum of 15 members.");
          console.log("  [PASS] Direct API bypass attempt with 16 members rejected with HTTP 400:", over16Json.fields.memberCount);

          // 3G. Verify public Pass lookup on Hackathon Status page without login
          const verifyPassRes = await origFetch(
            `http://127.0.0.1:${port}/api/hackathon/verify?id=${encodeURIComponent(leader.registration_code)}`
          );
          assert.equal(verifyPassRes.status, 200);
          const verifyPassJson = await verifyPassRes.json();
          assert.equal(verifyPassJson.verified, true);
          assert.equal(verifyPassJson.pass.registrationCode, leader.registration_code);
          assert.equal(verifyPassJson.pass.teamCode, team1.team_code);
          console.log("  [PASS] Public pass lookup verified without login ->", verifyPassJson.pass.registrationCode);
        } finally {
          await new Promise((r) => srv.close(r));
        }
      } finally {
        globalThis.fetch = origFetch;
      }
    } finally {
      await cleanupTestRows();
      console.log(`\nCleaned up test teams from database.`);
      await closeSql();
    }

    console.log("\nALL MANDATORY HACKATHON TESTS PASSED.");
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
