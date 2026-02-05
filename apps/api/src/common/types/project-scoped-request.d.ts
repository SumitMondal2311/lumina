import type { Project, ProjectMember } from "@repo/database";
import type { Request } from "express";

export interface ProjectScopedRequest extends Request {
    project: Project & {
        membership: Pick<ProjectMember, "role" | "createdAt">;
    };
}
