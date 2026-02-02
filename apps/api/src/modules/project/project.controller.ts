import { Controller, Post } from "@nestjs/common";

import { ProjectService } from "./project.service";

@Controller("projects")
export class ProjectController {
    constructor(private service: ProjectService) {}

    @Post()
    createProject() {
        return this.service.createProject();
    }
}
