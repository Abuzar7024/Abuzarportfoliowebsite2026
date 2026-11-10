import type { IncomingMessage, ServerResponse } from "node:http";
import { handleHackathonApi } from "../../src/server/hackathon/api";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return handleHackathonApi(req, res);
}
