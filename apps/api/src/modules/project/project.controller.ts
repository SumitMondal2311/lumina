import { Body, Controller, Post } from "@nestjs/common";
import {
    type CreateProjectSchema,
    createProjectSchema,
} from "@repo/validators";

import { ZodValidationPipe } from "@/common/pipes";
import { ProjectService } from "./project.service";

@Controller("projects")
export class ProjectController {
    constructor(private service: ProjectService) {}

    @Post()
    createProject(
        @Body(new ZodValidationPipe(createProjectSchema))
        dto: CreateProjectSchema,
    ) {
        return this.service.createProject(dto.name);
    }
}
