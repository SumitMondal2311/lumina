import * as path from "node:path";
import { Queue } from "bullmq";
import * as dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const REDIS_PORT = process.env.REDIS_PORT;
export const connection = new Redis({
    host: "localhost",
    port: REDIS_PORT ? parseInt(REDIS_PORT, 10) : 6379,
    maxRetriesPerRequest: null,
});

export const videoProcessingQueueName = "video-processing";
export const videoProcessingQueue = new Queue(videoProcessingQueueName, {
    connection,
});
