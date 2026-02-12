import type { VideoStatus } from "@repo/database";

export type GetVideoStatusResponse =
    | {
          status: Extract<VideoStatus, "PROCESSING">;
          progress: number;
      }
    | {
          status: Exclude<VideoStatus, "PROCESSING">;
      };
