import type { Video } from "@repo/database";
import type { Request } from "express";

export interface VideoScopedRequest extends Request {
    video: Video;
}
