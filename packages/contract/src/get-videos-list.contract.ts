import type { Video } from "@repo/database";

export type GetVideosListResponse = Array<
    Pick<Video, "id" | "status" | "title">
>;
