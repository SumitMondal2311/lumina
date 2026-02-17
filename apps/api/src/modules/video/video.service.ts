import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import {
    connection,
    VideoProcessingQueueData,
    videoProcessingQueueName,
} from "@repo/queue";
import { type BaseJobOptions, FlowProducer } from "bullmq";

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

    async confirmUpload(videoId: string) {
        const jobs = await prisma.$transaction(async (tx) => {
            const videos = await tx.video.updateMany({
                where: { id: videoId, status: VideoStatus.UPLOADING },
                data: { status: VideoStatus.PROCESSING },
            });

            if (videos.count <= 0) {
                throw new NotFoundException({ message: "Video not found!" });
            }

            const transcode = await prisma.job.create({
                data: { videoId, type: JobType.TRANSCODE },
                select: { id: true },
            });

            const generateThumbnail = await prisma.job.create({
                data: { videoId, type: JobType.GENERATE_THUMBNAIL },
                select: { id: true },
            });

            const extractAudio = await prisma.job.create({
                data: { videoId, type: JobType.EXTRACT_AUDIO },
                select: { id: true },
            });

            const transcribe = await prisma.job.create({
                data: { videoId, type: JobType.TRANSCRIBE },
                select: { id: true },
            });

            const generateCaptions = await prisma.job.create({
                data: { videoId, type: JobType.GENERATE_CAPTIONS },
                select: { id: true },
            });

            const generateEmbeddings = await prisma.job.create({
                data: { videoId, type: JobType.GENERATE_EMBEDDINGS },
                select: { id: true },
            });

            return {
                transcode,
                generateThumbnail,
                extractAudio,
                transcribe,
                generateCaptions,
                generateEmbeddings,
            };
        });

        const jobOpts: BaseJobOptions = {
            removeOnFail: false,
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        };

        const flowProducer = new FlowProducer({ connection });
        await flowProducer.add({
            queueName: videoProcessingQueueName,
            name: JobType.GENERATE_EMBEDDINGS,
            data: {
                videoId,
                jobId: jobs.generateEmbeddings.id,
            } satisfies VideoProcessingQueueData,
            opts: jobOpts,
            children: [
                {
                    queueName: videoProcessingQueueName,
                    name: JobType.GENERATE_CAPTIONS,
                    data: {
                        videoId,
                        jobId: jobs.generateCaptions.id,
                    } satisfies VideoProcessingQueueData,
                    opts: jobOpts,
                    children: [
                        {
                            queueName: videoProcessingQueueName,
                            name: JobType.TRANSCRIBE,
                            data: {
                                videoId,
                                jobId: jobs.transcribe.id,
                            } satisfies VideoProcessingQueueData,
                            opts: jobOpts,
                            children: [
                                {
                                    queueName: videoProcessingQueueName,
                                    name: JobType.EXTRACT_AUDIO,
                                    data: {
                                        videoId,
                                        jobId: jobs.extractAudio.id,
                                    } satisfies VideoProcessingQueueData,
                                    opts: jobOpts,
                                    children: [
                                        {
                                            queueName: videoProcessingQueueName,
                                            name: JobType.TRANSCODE,
                                            data: {
                                                videoId,
                                                jobId: jobs.transcode.id,
                                            } satisfies VideoProcessingQueueData,
                                            opts: jobOpts,
                                        },
                                        {
                                            queueName: videoProcessingQueueName,
                                            name: JobType.GENERATE_THUMBNAIL,
                                            data: {
                                                videoId,
                                                jobId: jobs.generateThumbnail
                                                    .id,
                                            } satisfies VideoProcessingQueueData,
                                            opts: jobOpts,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    async getPlaybackUrl(objectKey: string) {
        const playbackUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: env.AWS_S3_BUCKET_NAME,
                Key: objectKey,
            }),
            { expiresIn: 3600 },
        );

        return { playbackUrl };
    }
}
