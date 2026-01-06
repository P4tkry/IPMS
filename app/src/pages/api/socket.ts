import type { NextApiRequest, NextApiResponse } from "next";
import { initSocket } from "@/lib/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  initSocket(res as unknown as Parameters<typeof initSocket>[0]);
  res.status(200).json({ ok: true });
}
