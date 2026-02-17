import type { Prisma, VideoStatus } from "@repo/database";

export type GetVideoResponse = {
    id: string;
    title: string;
    objectKey: string;
    status: VideoStatus;
    createdAt: Date;
    metadata: Prisma.JsonValue;
};
