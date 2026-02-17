import type { Request } from "express";

export interface AuthRequest extends Request {
    user: {
        id: string;
        lastActiveProjectId: string | null;
        email: string;
        createdAt: Date;
    };
}
