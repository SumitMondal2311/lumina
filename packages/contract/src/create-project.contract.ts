import type { Project } from "@repo/database";
import { z } from "zod";

export const createProjectDto = z.object({
    name: z
        .string({ error: "Project name is required" })
        .trim()
        .nonempty("Enter project's name"),
});

export type CreateProjectDto = z.infer<typeof createProjectDto>;

export type CreateProjectResponse = Pick<Project, "id" | "name">;
