import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    type ConfirmUploadDto,
    confirmUploadDto,
} from "@repo/contract/confirm-upload";
import type { GetPlaybackUrlResponse } from "@repo/contract/get-playback-url";
import type { GetVideoResponse } from "@repo/contract/get-video";
import type { GetVideoStatusResponse } from "@repo/contract/get-video-status";
import { VideoStatus } from "@repo/database";

import { AuthGuard, VideoGuard } from "@/common/guards";
import { ZodValidationPipe } from "@/common/pipes";
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
    confirmUpload(
        @Req() req: VideoScopedRequest,
        @Body(new ZodValidationPipe(confirmUploadDto))
        dto: ConfirmUploadDto,
    ): Promise<void> {
        const { id: videoId, projectId } = req.video;
        return this.service.confirmUpload({ ...dto, projectId, videoId });
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

        if (!objectKey) {
            throw new BadRequestException({
                message: "Playback unavailable",
            });
        }

        return this.service.getPlaybackUrl(objectKey);
    }
}
