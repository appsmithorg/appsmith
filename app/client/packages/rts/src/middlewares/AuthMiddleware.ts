import type { Request, Response, NextFunction } from "express";

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.APPSMITH_RTS_SECRET;
  if (!secret) {
    console.warn("[AuthMiddleware] APPSMITH_RTS_SECRET is not set; rejecting request to protected endpoint");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const header = req.headers["x-rts-secret"];
  if (!header || header !== secret) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}
