import {
    BadRequestException,
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { prisma } from "@repo/database";

import { AuthRequest, type ProjectScopedRequest } from "../types";

@Injectable()
export class ProjectGuard implements CanActivate {
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx
            .switchToHttp()
            .getRequest<AuthRequest & ProjectScopedRequest>();

        const projectId = req.params.id;
        if (!projectId) {
            throw new BadRequestException({
                message: "Missing required params.",
            });
        }

        if (typeof projectId !== "string") {
            throw new BadRequestException({
                message: "Invalid params type.",
            });
        }

        const membership = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: { projectId, userId: req.user.id },
            },
            omit: { userId: true, projectId: true },
            include: { project: { omit: { deletedAt: true } } },
        });

        if (!membership) {
            throw new ForbiddenException({
                message: "Action not permitted",
            });
        }

        const { project, ...restOfMembership } = membership;
        req.project = { ...project, membership: restOfMembership };
        return true;
    }
}
