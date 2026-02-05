import type { User } from "@repo/database";
import type { Request } from "express";

export interface AuthRequest extends Request {
    user: User;
}
