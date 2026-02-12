import type { Project } from "@repo/database";

export type GetProjectsListResponse = Array<Pick<Project, "id" | "name">>;
