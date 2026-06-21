import type { Request, Response, NextFunction } from "express";

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.APPSMITH_RTS_SECRET;
  if (!secret) {
    return next();
  }
  const header = req.headers["x-rts-secret"];
  if (!header || header !== secret) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}
