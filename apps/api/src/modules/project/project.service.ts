import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectMemberRole, prisma } from "@repo/database";

@Injectable()
export class ProjectService {
    async createProject(name: string) {
        const user = await prisma.user.findUnique({
            where: { id: "cml47bdlc00003b654gin7i9d" },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException({ message: "User not found!" });
        }

        return await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: { name },
                select: { id: true },
            });

            return tx.projectMember.create({
                data: {
                    userId: user.id,
                    projectId: newProject.id,
                    role: ProjectMemberRole.OWNER,
                },
                omit: { projectId: true },
                include: { project: true },
            });
        });
    }

    async getVideos(projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId, deletedAt: { equals: null } },
            select: { id: true },
        });

        if (!project) {
            throw new NotFoundException({ message: "Project not found!" });
        }

        return prisma.video.findMany({
            where: { projectId },
            select: { id: true, title: true, status: true },
        });
    }
}
