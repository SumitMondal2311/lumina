import type { Request } from "express";

export interface ProjectScopedRequest extends Request {
    project: {
        id: string;
        name: string;
        createdAt: Date;
    } & {
        membership: { role: ProjectMemberRole; createdAt: Date };
    };
}
