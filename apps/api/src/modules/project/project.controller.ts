import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
    type CreateProjectDto,
    type CreateProjectResponse,
    createProjectDto,
} from "@repo/contract/create-project";
import {
    type CreateVideoDto,
    type CreateVideoResponse,
    createVideoDto,
} from "@repo/contract/create-video";
import type { GetProjectResponse } from "@repo/contract/get-project";
import type { GetProjectsListResponse } from "@repo/contract/get-projects-list";
import type { GetVideosListResponse } from "@repo/contract/get-videos-list";

import { AuthGuard, ProjectGuard } from "@/common/guards";
import { ZodValidationPipe } from "@/common/pipes";
import type { AuthRequest, ProjectScopedRequest } from "@/common/types";
import { ProjectService } from "./project.service";

@Controller("projects")
@UseGuards(AuthGuard)
export class ProjectController {
    constructor(private service: ProjectService) {}

    @Post()
    createProject(
        @Req() req: AuthRequest,
        @Body(new ZodValidationPipe(createProjectDto))
        dto: CreateProjectDto,
    ): Promise<CreateProjectResponse> {
        return this.service.createProject({ ...dto, userId: req.user.id });
    }

    @Get()
    getProjectsList(@Req() req: AuthRequest): Promise<GetProjectsListResponse> {
        return this.service.getProjectsList(req.user.id);
    }

    @UseGuards(ProjectGuard)
    @Get(":id")
    getProject(
        @Req() req: AuthRequest & ProjectScopedRequest,
    ): GetProjectResponse {
        return req.project;
    }

    @UseGuards(ProjectGuard)
    @Post(":id/videos")
    createVideo(
        @Req() req: ProjectScopedRequest,
        @Body(new ZodValidationPipe(createVideoDto)) dto: CreateVideoDto,
    ): Promise<CreateVideoResponse> {
        return this.service.createVideo({
            ...dto,
            projectId: req.project.id,
        });
    }

    @UseGuards(ProjectGuard)
    @Get(":id/videos")
    getVideosList(
        @Req() req: ProjectScopedRequest,
    ): Promise<GetVideosListResponse> {
        return this.service.getVideosList(req.project.id);
    }
}
