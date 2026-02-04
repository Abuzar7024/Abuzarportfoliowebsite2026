import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import nodemailer from "npm:nodemailer";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Contact Form Endpoint
app.post("/make-server-24c24932/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { fullName, email, purpose, message, projectType, budget, companyName } = body;

    // Validate env variables
    const host = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const user = Deno.env.get("SMTP_USER") || "abuzxarrr87@gmail.com";
    const pass = Deno.env.get("SMTP_PASS");
    const receiver = Deno.env.get("CONTACT_RECEIVER_EMAIL") || "abuzxarrr87@gmail.com";

    if (!user || !pass) {
      console.error("Missing SMTP credentials");
      return c.json({ success: false, message: "Server configuration error (SMTP credentials missing)." }, 500);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    let conditionalInfo = "";
    if (purpose === "Freelance project") {
      conditionalInfo = `\nProject Type: ${projectType}\nBudget: ${budget || "Not specified"}`;
    } else if (purpose === "Job opportunity") {
      conditionalInfo = `\nCompany Name: ${companyName || "Not specified"}`;
    }

    const emailText = `
New Portfolio Inquiry from ${fullName}

Name: ${fullName}
Email: ${email}
Purpose: ${purpose}${conditionalInfo}

Message:
${message}
    `;

    await transporter.sendMail({
      from: `"${fullName}" <${user}>`,
      to: receiver,
      subject: `[Portfolio] ${purpose}: ${fullName}`,
      text: emailText,
      replyTo: email,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Contact Form Error:", error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.get("/make-server-24c24932/health", (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);
