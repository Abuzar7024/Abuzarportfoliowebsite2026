import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAvatarApi } from "../../src/server/avatar-api";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return handleAvatarApi(req, res);
}
