import { Prisma } from "@repo/database";
import type { Request } from "express";

export interface VideoScopedRequest extends Request {
    video: {
        id: string;
        projectId: string;
        title: string;
        objectKey: string;
        status: VideoStatus;
        createdAt: Date;
        metadata: Prisma.JsonValue;
    };
}
