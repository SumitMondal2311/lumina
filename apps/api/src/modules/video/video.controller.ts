import {
    BadRequestException,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import type { GetPlaybackUrlResponse } from "@repo/contract/get-playback-url";
import type { GetVideoResponse } from "@repo/contract/get-video";
import type { GetVideoStatusResponse } from "@repo/contract/get-video-status";
import { VideoStatus } from "@repo/database";

import { AuthGuard, VideoGuard } from "@/common/guards";
import type { VideoScopedRequest } from "@/common/types";
import { VideoService } from "./video.service";

@UseGuards(AuthGuard, VideoGuard)
@Controller("videos")
export class VideoController {
    constructor(private service: VideoService) {}

    @Get(":id/status")
    getVideoStatus(
        @Req() req: VideoScopedRequest,
    ): Promise<GetVideoStatusResponse> {
        const { id: videoId, status } = req.video;
        return this.service.getVideoStatus({ videoId, videoStatus: status });
    }

    @Get(":id")
    getVideo(@Req() req: VideoScopedRequest): GetVideoResponse {
        return req.video;
    }

    @Post(":id/confirm-upload")
    @HttpCode(200)
    confirmUpload(@Req() req: VideoScopedRequest): Promise<void> {
        return this.service.confirmUpload(req.video.id);
    }

    @Get(":id/playback-url")
    @HttpCode(200)
    getPlaybackUrl(
        @Req() req: VideoScopedRequest,
    ): Promise<GetPlaybackUrlResponse> {
        const { status, objectKey } = req.video;
        if (status !== VideoStatus.READY) {
            throw new BadRequestException({
                message: "Video is not ready for playback",
            });
        }

        return this.service.getPlaybackUrl(objectKey);
    }
}
