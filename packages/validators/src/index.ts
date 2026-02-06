import z from "zod";

export const createProjectSchema = z.object({
    name: z
        .string({ error: "Project name is required" })
        .trim()
        .nonempty("Enter project's name"),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const createUploadUrlSchema = z.object({
    fileType: z
        .string({ error: "File type is required" })
        .trim()
        .nonempty("Provide file type"),
    fileSize: z.number({ error: "File size is required" }),
});

export type CreateUploadUrlSchema = z.infer<typeof createUploadUrlSchema>;

export const uploadCompleteSuccessSchema = z.object({
    objectKey: z
        .string({ error: "Storage key is required" })
        .trim()
        .nonempty("Enter storage key"),
});

export type UploadCompleteSuccessSchema = z.infer<
    typeof uploadCompleteSuccessSchema
>;
