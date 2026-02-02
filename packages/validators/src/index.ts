import z from "zod";

export const createProjectSchema = z.object({
    name: z
        .string({ error: "Project name is required" })
        .trim()
        .nonempty("Enter project's name"),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
