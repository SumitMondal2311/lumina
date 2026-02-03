// import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import { VideoProcessingQueueData, videoProcessingQueue } from "@repo/queue";

import { generateObjectKey } from "@/common/utils";

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
            omit: { projectId: true },
        });
    }

    async getVideo({
        projectId,
        videoId,
    }: {
        projectId: string;
        videoId: string;
    }) {
        const video = await prisma.video.findFirst({
            where: { projectId, id: videoId, deletedAt: { equals: null } },
            omit: { objectKey: true, projectId: true },
        });

        if (!video) {
            throw new NotFoundException({ message: "Video not found!" });
        }

        const jobs = await prisma.job.findMany({
            where: { videoId },
            select: { status: true },
        });

        const totalJobs = jobs.length;
        const completedJobs = jobs.reduce(
            (acc, job) =>
                job.status === JobStatus.COMPLETED ||
                job.status === JobStatus.FAILED
                    ? acc + 1
                    : acc,
            0,
        );

        if (video.status === VideoStatus.PROCESSING) {
            return {
                ...video,
                progress:
                    totalJobs === 0
                        ? 0
                        : Math.floor(completedJobs / totalJobs) * 100,
            };
        }

        return video;
    }

    async uploadUrl({
        projectId,
        videoId,
    }: {
        projectId: string;
        videoId: string;
    }) {
        const video = await prisma.video.findFirst({
            where: { id: videoId, projectId, status: VideoStatus.UPLOADING },
            select: { id: true },
        });

        if (!video) {
            throw new NotFoundException({ message: "Video not found!" });
        }

        // TODO:
        // const client = new S3Client({ region: "us-east-1" });
        // const command = new PutObjectCommand({
        //     Bucket: "my-bucket",
        //     Key: `videos/${videoId}.mp4`,
        // });

        // const preSignedUrl = await getSignedUrl(client, command, {
        //     expiresIn: 3600,
        // });

        return {
            objectKey: generateObjectKey(videoId),
            preSignedUrl: "https://bucket-name.s3.region.amazonaws.com",
        };
    }

    async uploadComplete({
        projectId,
        videoId,
        objectKey,
    }: {
        projectId: string;
        videoId: string;
        objectKey: string;
    }) {
        const expectedObjectKey = generateObjectKey(videoId);
        if (objectKey !== expectedObjectKey) {
            throw new BadRequestException({ message: "Object key mismatch." });
        }

        const jobs = await prisma.$transaction(async (tx) => {
            const videos = await tx.video.updateMany({
                where: {
                    id: videoId,
                    projectId,
                    status: VideoStatus.UPLOADING,
                },
                data: { objectKey, status: VideoStatus.PROCESSING },
            });

            if (videos.count <= 0) {
                throw new NotFoundException({ message: "Video not found!" });
            }

            return tx.job.createManyAndReturn({
                data: [
                    { type: JobType.TRANSCRIBE, videoId },
                    { type: JobType.EXTRACT_AUDIO, videoId },
                    { type: JobType.TRANSCODE, videoId },
                    { type: JobType.GENERATE_EMBEDDINGS, videoId },
                ],
                select: { id: true, type: true },
                skipDuplicates: true,
            });
        });

        jobs.forEach(async (job) => {
            await videoProcessingQueue.add(job.type, {
                videoId,
                jobId: job.id,
            } satisfies VideoProcessingQueueData);
        });
    }
}
