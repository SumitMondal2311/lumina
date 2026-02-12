import type { Project, ProjectMember } from "@repo/database";

export type GetProjectResponse = Omit<Project, "deletedAt"> & {
    membership: Pick<ProjectMember, "role" | "createdAt">;
};
