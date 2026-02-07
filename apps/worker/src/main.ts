import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { WorkerModule } from "./worker.module";

(async () => {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    app.enableShutdownHooks();
    Logger.log("🚀 Worker process is listening for jobs...");
})();
