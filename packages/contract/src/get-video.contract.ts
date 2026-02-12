import type { Video } from "@repo/database";

export type GetVideoResponse = Omit<Video, "deletedAt">;
