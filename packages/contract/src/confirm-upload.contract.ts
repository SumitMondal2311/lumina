import { z } from "zod";

export const confirmUploadDto = z.object({
    objectKey: z
        .string({ error: "Object key is required" })
        .trim()
        .nonempty("Enter object key"),
});

export type ConfirmUploadDto = z.infer<typeof confirmUploadDto>;
