import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    type CreateUploadUrlSchema,
    createUploadUrlSchema,
    type UploadCompleteSuccessSchema,
    uploadCompleteSuccessSchema,
} from "@repo/validators";

import { AuthGuard, VideoGuard } from "@/common/guards";
import { ZodValidationPipe } from "@/common/pipes";
import type { VideoScopedRequest } from "@/common/types";
import { VideoService } from "./video.service";

@UseGuards(AuthGuard, VideoGuard)
@Controller("videos")
export class VideoController {
    constructor(private service: VideoService) {}

    @Get(":id/status")
    getVideoStatus(@Req() req: VideoScopedRequest) {
        const { id: videoId, status } = req.video;
        return this.service.getVideoStatus({ videoId, videoStatus: status });
    }

    @Get(":id")
    getVideo(@Req() req: VideoScopedRequest) {
        return req.video;
    }

    @Post(":id/upload-url")
    @HttpCode(200)
    createUploadUrl(
        @Req() req: VideoScopedRequest,
        @Body(new ZodValidationPipe(createUploadUrlSchema))
        dto: CreateUploadUrlSchema,
    ) {
        const { id: videoId, projectId } = req.video;
        return this.service.createUploadUrl({ ...dto, projectId, videoId });
    }

    @Post(":id/upload-complete")
    @HttpCode(200)
    async uploadComplete(
        @Req() req: VideoScopedRequest,
        @Body(new ZodValidationPipe(uploadCompleteSuccessSchema))
        dto: UploadCompleteSuccessSchema,
    ) {
        const { id: videoId, projectId } = req.video;
        await this.service.uploadComplete({ ...dto, projectId, videoId });

        return { success: true };
    }
}
