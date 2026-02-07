import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { env } from "./configs/env";

(async () => {
    const app = await NestFactory.create(AppModule, {
        cors: { origin: true, credentials: true },
    });

    app.use(cookieParser());
    app.use(helmet());

    app.setGlobalPrefix("api/v1");

    app.enableShutdownHooks();

    const PORT = env.PORT ?? 4132;
    await app.listen(PORT, () => {
        Logger.log(`Server is listening on port ${PORT}...`);
    });
})();
