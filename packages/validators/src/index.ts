import z from "zod";

export const createProjectSchema = z.object({
    name: z
        .string({ error: "Project name is required" })
        .trim()
        .nonempty("Enter project's name"),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const createUploadUrlSchema = z.object({
    videoType: z.enum(
        ["video/webm", "video/mp4", "video/x-matroska", "video/quicktime"],
        { error: "Unsupported video type" },
    ),
    videoSize: z.number({ error: "Video size is required" }).positive(),
});

export type CreateUploadUrlSchema = z.infer<typeof createUploadUrlSchema>;

export const uploadCompleteSuccessSchema = z.object({
    objectKey: z
        .string({ error: "Object key is required" })
        .trim()
        .nonempty("Enter object key"),
});

export type UploadCompleteSuccessSchema = z.infer<
    typeof uploadCompleteSuccessSchema
>;
