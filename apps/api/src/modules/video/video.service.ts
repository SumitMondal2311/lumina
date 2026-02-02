import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@repo/database";

@Injectable()
export class VideoService {
    async createVideo(projectId: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!project) {
            throw new NotFoundException({ message: "Project not found!" });
        }

        return prisma.video.create({
            data: { projectId },
        });
    }
}
