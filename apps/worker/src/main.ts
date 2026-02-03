import { NestFactory } from "@nestjs/core";

import { JobRunnerService } from "./job-runner.service";
import { WorkerModule } from "./worker.module";

(async () => {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    app.get(JobRunnerService).start();
})();
