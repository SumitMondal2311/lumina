import { Module } from "@nestjs/common";

import { ProjectModule } from "./modules/project/project.module";
import { VideoModule } from "./modules/video/video.module";

@Module({
    imports: [ProjectModule, VideoModule],
})
export class AppModule {}
