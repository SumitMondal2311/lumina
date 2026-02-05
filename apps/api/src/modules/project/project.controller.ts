import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
    type CreateProjectSchema,
    createProjectSchema,
} from "@repo/validators";

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
        @Body(new ZodValidationPipe(createProjectSchema))
        dto: CreateProjectSchema,
    ) {
        return this.service.createProject({ ...dto, userId: req.user.id });
    }

    @Get()
    getProjectsList(@Req() req: AuthRequest) {
        return this.service.getProjectsList(req.user.id);
    }

    @UseGuards(ProjectGuard)
    @Get(":id")
    getProject(@Req() req: AuthRequest & ProjectScopedRequest) {
        return req.project;
    }

    @UseGuards(ProjectGuard)
    @Post(":id/videos")
    createVideo(@Req() req: ProjectScopedRequest) {
        return this.service.createVideo(req.project.id);
    }

    @UseGuards(ProjectGuard)
    @Get(":id/videos")
    getVideosList(@Req() req: ProjectScopedRequest) {
        return this.service.getVideosList(req.project.id);
    }
}
