import { Injectable } from "@nestjs/common";
import { ProjectMemberRole, prisma } from "@repo/database";

@Injectable()
export class ProjectService {
    async createProject({ userId, name }: { userId: string; name: string }) {
        return await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: { name },
                select: { id: true },
            });

            return tx.projectMember.create({
                data: {
                    role: ProjectMemberRole.OWNER,
                    projectId: newProject.id,
                    userId,
                },
                omit: { userId: true, projectId: true },
                include: { project: true },
            });
        });
    }

    async getProjectsList(userId: string) {
        const memberships = await prisma.projectMember.findMany({
            where: { userId, project: { deletedAt: { equals: null } } },
            omit: { userId: true, projectId: true },
            include: { project: true },
        });

        return memberships.map((membership) => ({
            ...membership.project,
            membership: {
                role: membership.role,
                createdAt: membership.createdAt,
            },
        }));
    }

    async createVideo(projectId: string) {
        return prisma.video.create({
            data: { projectId },
            omit: { projectId: true },
        });
    }

    async getVideosList(projectId: string) {
        return prisma.video.findMany({
            where: { projectId },
            select: { id: true, title: true, status: true },
        });
    }
}
