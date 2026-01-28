import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { env } from "./configs/env";

(async () => {
    const app = await NestFactory.create(AppModule, {
        cors: { origin: true, credentials: true },
    });

    app.setGlobalPrefix("api/v1");

    const PORT = env.PORT ?? 4132;
    await app.listen(PORT, () => {
        Logger.log(`Server is listening or port ${PORT}...`);
    });
})();
