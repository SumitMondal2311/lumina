import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    type UploadSuccessSchema,
    uploadSuccessSchema,
} from "@repo/validators";

import { ProjectGuard } from "@/common/guards";
import { ZodValidationPipe } from "@/common/pipes";
import type { ProjectScopedRequest } from "@/common/types";
import { VideoService } from "./video.service";

@UseGuards(ProjectGuard)
@Controller("videos")
export class VideoController {
    constructor(private service: VideoService) {}

    @Post()
    createVideo(@Req() req: ProjectScopedRequest) {
        return this.service.createVideo(req.project.id);
    }

    @Get(":id")
    getVideoStatus(
        @Req() req: ProjectScopedRequest,
        @Param("id") videoId: string,
    ) {
        return this.service.getVideo({ videoId, projectId: req.project.id });
    }

    @Get(":id")
    getVideo(@Req() req: ProjectScopedRequest, @Param("id") videoId: string) {
        return this.service.getVideo({ videoId, projectId: req.project.id });
    }

    @Post(":id/upload-url")
    @HttpCode(200)
    uploadUrl(@Req() req: ProjectScopedRequest, @Param("id") videoId: string) {
        return this.service.uploadUrl({ projectId: req.project.id, videoId });
    }

    @Post(":id/upload-complete")
    @HttpCode(200)
    async uploadComplete(
        @Req() req: ProjectScopedRequest,
        @Param("id") videoId: string,
        @Body(new ZodValidationPipe(uploadSuccessSchema))
        dto: UploadSuccessSchema,
    ) {
        await this.service.uploadComplete({
            projectId: req.project.id,
            videoId,
            objectKey: dto.objectKey,
        });

        return { success: true };
    }
}
