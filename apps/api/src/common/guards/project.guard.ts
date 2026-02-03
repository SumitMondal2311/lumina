import {
    BadRequestException,
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { prisma } from "@repo/database";

import type { ProjectScopedRequest } from "../types";

@Injectable()
export class ProjectGuard implements CanActivate {
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest<ProjectScopedRequest>();

        const projectId = req.headers["x-project-id"];
        if (!projectId) {
            throw new BadRequestException({
                message: "Missing required headers.",
            });
        }

        if (typeof projectId !== "string") {
            throw new BadRequestException({
                message: "Invalid header type.",
            });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            throw new ForbiddenException({
                message: "Action not permitted",
            });
        }

        req.project = project;
        return true;
    }
}
