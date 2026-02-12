import type { Video } from "@repo/database";
import { z } from "zod";

export const createVideoDto = z.object({
    videoType: z.enum(
        ["video/webm", "video/mp4", "video/x-matroska", "video/quicktime"],
        { error: "Unsupported video type" },
    ),
    videoSize: z.number({ error: "Video size is required" }).positive(),
});

export type CreateVideoDto = z.infer<typeof createVideoDto>;

export type CreateVideoResponse = {
    video: Pick<Video, "id" | "status" | "title">;
    presignedUrl: string;
    objectKey: string;
};
