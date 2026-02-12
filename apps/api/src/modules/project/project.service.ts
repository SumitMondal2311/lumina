import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ProjectMemberRole, prisma } from "@repo/database";

import { generateObjectKey } from "@/common/utils";
import { env } from "@/configs/env";
import { s3 } from "@/infra/s3.client";

@Injectable()
export class ProjectService {
    async createProject({ userId, name }: { userId: string; name: string }) {
        const { project } = await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: { name },
                select: { id: true },
            });

            await tx.user.update({
                where: { id: userId },
                data: { lastActiveProjectId: newProject.id },
            });

            return tx.projectMember.create({
                data: {
                    role: ProjectMemberRole.OWNER,
                    projectId: newProject.id,
                    userId,
                },
                omit: {
                    userId: true,
                    projectId: true,
                    role: true,
                    createdAt: true,
                },
                include: {
                    project: { select: { id: true, name: true } },
                },
            });
        });

        return project;
    }

    async getProjectsList(userId: string) {
        const memberships = await prisma.projectMember.findMany({
            where: { userId, project: { deletedAt: { equals: null } } },
            omit: {
                userId: true,
                projectId: true,
                role: true,
                createdAt: true,
            },
            include: { project: { select: { id: true, name: true } } },
        });

        return memberships.map((membership) => ({
            ...membership.project,
        }));
    }

    async createVideo({
        projectId,
        videoType,
        videoSize,
    }: {
        projectId: string;
        videoType: string;
        videoSize: number;
    }) {
        if (videoSize > 50 * 1000000) {
            throw new BadRequestException({
                message: "Video size must be under 50 MB",
            });
        }

        const newVideo = await prisma.video.create({
            data: { projectId },
            select: { id: true, status: true, title: true },
        });

        const objectKey = generateObjectKey({
            projectId,
            videoId: newVideo.id,
            fileType: videoType,
        });

        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            ContentType: videoType,
            Key: objectKey,
        });

        const presignedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600,
        });

        return { video: newVideo, presignedUrl, objectKey };
    }

    async getVideosList(projectId: string) {
        return prisma.video.findMany({
            where: { projectId },
            select: { id: true, title: true, status: true },
        });
    }
}
