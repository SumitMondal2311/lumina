import type { VideoStatus } from "@repo/database";

export type GetVideosListResponse = Array<{
    id: string;
    title: string;
    status: VideoStatus;
}>;
