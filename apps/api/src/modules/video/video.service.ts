// import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import { VideoProcessingQueueData, videoProcessingQueue } from "@repo/queue";

import { generateObjectKey } from "@/common/utils";

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

    async uploadUrl(videoId: string) {
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
        // const expectedObjectKey = generateObjectKey(videoId);
        // if (objectKey !== expectedObjectKey) {
        //     throw new BadRequestException({ message: "Object key mismatch." });
        // }

        const isVideoExists = await prisma.video.findFirst({
            where: { objectKey, projectId },
        });

        if (isVideoExists) {
            throw new ConflictException({ message: "Video already exists!" });
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
