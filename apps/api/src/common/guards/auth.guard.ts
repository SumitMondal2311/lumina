import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { prisma } from "@repo/database";

import type { AuthRequest } from "../types";

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest<AuthRequest>();

        const user = await prisma.user.findUnique({
            where: { id: "cml47bdlc00003b654gin7i9d" },
        });

        if (!user) {
            throw new ForbiddenException({
                message: "Action not permitted",
            });
        }

        req.user = user;
        return true;
    }
}
