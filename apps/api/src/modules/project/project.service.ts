import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectMemberRole, prisma } from "@repo/database";

@Injectable()
export class ProjectService {
    async createProject() {
        const user = await prisma.user.findUnique({
            where: { id: "cml47bdlc00003b654gin7i9d" },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException({ message: "User not found!" });
        }

        return await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: { name: "Dummy Project" },
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
}
