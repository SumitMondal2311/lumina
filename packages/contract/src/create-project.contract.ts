import { z } from "zod";

export const createProjectDto = z.object({
    name: z
        .string({ error: "Project name is required" })
        .trim()
        .nonempty("Enter project name"),
});

export type CreateProjectResponse = { id: string; name: string };
export type CreateProjectDto = z.infer<typeof createProjectDto>;
