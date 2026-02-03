import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { ProjectScopedRequest } from "../types";

export const Project = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest<ProjectScopedRequest>();
        return req.project ?? {};
    },
);
