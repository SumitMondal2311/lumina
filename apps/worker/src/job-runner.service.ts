import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import {
    connection,
    VideoProcessingQueueData,
    videoProcessingQueueName,
} from "@repo/queue";
import { Job, Worker } from "bullmq";
import { env } from "./configs/env";

@Injectable()
export class JobRunnerService implements OnModuleInit, OnModuleDestroy {
    private worker?: Worker;
    private readonly logger = new Logger(JobRunnerService.name);

    private sleep(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }

    onModuleInit() {
        if (this.worker) return;

        this.worker = new Worker(
            videoProcessingQueueName,
            async (bullJob: Job<VideoProcessingQueueData>) => {
                const { videoId, jobId } = bullJob.data;

                const { count } = await prisma.job.updateMany({
                    where: {
                        id: jobId,
                        status: {
                            in: [JobStatus.PENDING, JobStatus.IN_PROGRESS],
                        },
                    },
                    data: { status: JobStatus.IN_PROGRESS },
                });

                if (count <= 0) {
                    return this.logger.warn(
                        `Job ${jobId} is not in valid state to start. Skipping...`,
                    );
                }

                this.logger.log(
                    `[Attempt ${bullJob.attemptsMade + 1}] Running ${bullJob.name} for video ${videoId}`,
                );

                if (Math.random() < 0.25) {
                    throw new Error("Simulated processing failure");
                }

                switch (bullJob.name) {
                    case JobType.TRANSCODE:
                        await this.sleep(3000);
                        break;
                    case JobType.GENERATE_THUMBNAIL:
                        await this.sleep(2000);
                        break;
                    case JobType.EXTRACT_AUDIO:
                        await this.sleep(4000);
                        break;
                    case JobType.TRANSCRIBE:
                        await this.sleep(7000);
                        break;
                    case JobType.GENERATE_CAPTIONS:
                        await this.sleep(6000);
                        break;
                    case JobType.GENERATE_EMBEDDINGS:
                        await this.sleep(5000);
                        break;
                    default:
                        throw new Error(`Unhandled job: ${bullJob.name}`);
                }

                await prisma.job.updateMany({
                    where: { id: jobId, status: JobStatus.IN_PROGRESS },
                    data: { status: JobStatus.COMPLETED },
                });

                this.logger.log(
                    `Completed ${bullJob.name} for video ${videoId}`,
                );
            },
            {
                connection,
                concurrency: env.isProd ? 4 : 1,
            },
        );

        this.worker.on(
            "completed",
            async (job: Job<VideoProcessingQueueData>) => {
                await this.reconcileVideo(job.data.videoId);
            },
        );

        this.worker.on(
            "failed",
            async (job: Job<VideoProcessingQueueData> | undefined, err) => {
                if (!job) return;
                const { videoId, jobId } = job.data;

                this.logger.error(`Job ${jobId} failed: ${err.message}`);

                if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
                    await prisma.job.update({
                        where: { id: jobId },
                        data: {
                            status: JobStatus.FAILED,
                            lastError: err.message,
                        },
                    });

                    await this.reconcileVideo(videoId);
                }
            },
        );
    }

    onModuleDestroy() {
        if (!this.worker) return;
        this.worker.close();
        this.worker = undefined;
    }

    async reconcileVideo(videoId: string) {
        const jobs = await prisma.job.findMany({
            where: { videoId },
            select: { status: true },
        });

        if (jobs.some((job) => job.status === JobStatus.FAILED)) {
            return prisma.video.update({
                where: { id: videoId },
                data: { status: VideoStatus.FAILED },
            });
        }

        if (jobs.every((job) => job.status === JobStatus.COMPLETED)) {
            return prisma.video.update({
                where: { id: videoId },
                data: { status: VideoStatus.READY },
            });
        }
    }
}
