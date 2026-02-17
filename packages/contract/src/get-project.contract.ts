import type { ProjectMemberRole } from "@repo/database";

export type GetProjectResponse = {
    id: string;
    name: string;
    createdAt: Date;
} & {
    membership: { role: ProjectMemberRole; createdAt: Date };
};
