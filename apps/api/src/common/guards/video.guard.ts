import {
    BadRequestException,
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { prisma } from "@repo/database";

import { AuthRequest, VideoScopedRequest } from "../types";

@Injectable()
export class VideoGuard implements CanActivate {
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx
            .switchToHttp()
            .getRequest<AuthRequest & VideoScopedRequest>();

        const videoId = req.params.id;
        if (!videoId) {
            throw new BadRequestException({
                message: "Missing required params.",
            });
        }

        if (typeof videoId !== "string") {
            throw new BadRequestException({
                message: "Invalid params type.",
            });
        }

        const video = await prisma.video.findFirst({
            where: {
                id: videoId,
                project: { members: { some: { userId: req.user.id } } },
            },
            omit: { duration: true, deletedAt: true },
        });

        if (!video) {
            throw new ForbiddenException({
                message: "Action not permitted",
            });
        }

        req.video = video;
        return true;
    }
}
