import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import { VideoProcessingQueueData, videoProcessingQueue } from "@repo/queue";
import { CreateUploadUrlSchema } from "@repo/validators";
import { extension } from "mime-types";

import { env } from "@/configs/env";
import { s3 } from "@/infra/s3.client";

@Injectable()
export class VideoService {
    async getVideoStatus({
        videoStatus,
        videoId,
    }: {
        videoStatus: VideoStatus;
        videoId: string;
    }) {
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

        if (videoStatus === VideoStatus.PROCESSING) {
            return {
                status: videoStatus,
                progress:
                    totalJobs === 0
                        ? 0
                        : Math.floor((completedJobs / totalJobs) * 100),
            };
        }

        return { status: videoStatus };
    }

    async createUploadUrl({
        projectId,
        videoId,
        videoType,
        videoSize,
    }: CreateUploadUrlSchema & {
        projectId: string;
        videoId: string;
    }) {
        // 50MB
        if (videoSize > 50 * 1000000) {
            throw new BadRequestException({
                message: "Video size must be under 50 MB",
            });
        }

        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            ContentType: videoType,
            Key: `uploads/${projectId}/raw/${videoId}.${extension(videoType) ?? "bin"}`,
        });

        const preSignedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600, // 1 hr
        });

        return { objectKey: command.input.Key, preSignedUrl };
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
            await videoProcessingQueue.add(
                job.type,
                {
                    videoId,
                    jobId: job.id,
                } satisfies VideoProcessingQueueData,
                {
                    attempts: 3,
                    backoff: { type: "exponential", delay: 5000 },
                },
            );
        });
    }

    async getPlaybackUrl(objectKey: string) {
        const playbackExpiresIn = 60 * 60;
        const playbackUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: env.AWS_S3_BUCKET_NAME,
                Key: objectKey,
            }),
            { expiresIn: playbackExpiresIn },
        );

        return { playbackUrl, expiresIn: playbackExpiresIn };
    }
}
