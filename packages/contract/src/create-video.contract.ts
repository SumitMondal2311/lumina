import type { VideoStatus } from "@repo/database";
import { z } from "zod";

export const createVideoDto = z.object({
    videoTitle: z
        .string({ error: "Video title is required" })
        .trim()
        .nonempty("Enter video title"),
    videoType: z.enum(
        ["video/webm", "video/mp4", "video/x-matroska", "video/quicktime"],
        { error: "Unsupported video type" },
    ),
    videoSize: z.number({ error: "Video size is required" }).positive(),
});

export type CreateVideoDto = z.infer<typeof createVideoDto>;

export type CreateVideoResponse = {
    video: { id: string; status: VideoStatus; title: string };
    presignedUrl: string;
};
