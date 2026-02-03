import { Injectable, Logger } from "@nestjs/common";
import { JobStatus, JobType, prisma, VideoStatus } from "@repo/database";
import { connection, videoProcessingQueueName } from "@repo/queue";
import { Worker } from "bullmq";

@Injectable()
export class JobRunnerService {
    private worker?: Worker;
    private readonly logger = new Logger(JobRunnerService.name);

    private sleep() {
        return new Promise((res) =>
            setTimeout(res, Math.floor(Math.random() * 6) + 3),
        );
    }

    start() {
        if (this.worker) return;

        this.worker = new Worker(
            videoProcessingQueueName,
            async (bullJob) => {
                const { jobId, videoId } = bullJob.data;

                await prisma.job.update({
                    where: { id: jobId, status: JobStatus.PENDING },
                    data: { status: JobStatus.IN_PROGRESS },
                });

                this.logger.log(`Started ${bullJob.name} for video ${videoId}`);

                switch (bullJob.name) {
                    case JobType.TRANSCRIBE:
                        await this.sleep();
                        break;
                    case JobType.EXTRACT_AUDIO:
                        await this.sleep();
                        break;
                    case JobType.TRANSCODE:
                        await this.sleep();
                        break;
                    case JobType.GENERATE_EMBEDDINGS:
                        await this.sleep();
                        break;
                    default:
                        throw new Error(`Unknown job type: ${bullJob.name}`);
                }

                await prisma.job.update({
                    where: { id: jobId, status: JobStatus.IN_PROGRESS },
                    data: { status: JobStatus.COMPLETED },
                });

                this.logger.log(
                    `Completed ${bullJob.name} for video ${videoId}`,
                );
            },
            {
                connection,
                concurrency: 4,
            },
        );
    }

    stop() {
        if (!this.worker) return;
        this.worker.close();
        this.worker = undefined;
    }

    async reconcileVideo(videoId: string) {
        const jobs = await prisma.job.findMany({
            where: { videoId },
            select: { status: true },
        });

        if (jobs.every((job) => job.status === JobStatus.COMPLETED)) {
            await prisma.video.update({
                where: { id: videoId, status: VideoStatus.PROCESSING },
                data: { status: VideoStatus.READY },
            });
        }
    }
}
