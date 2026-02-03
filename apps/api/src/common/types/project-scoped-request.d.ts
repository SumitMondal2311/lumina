import type { Project } from "@repo/database";
import type { Request } from "express";

export interface ProjectScopedRequest extends Request {
    project: Project;
}
