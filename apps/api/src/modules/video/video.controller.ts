import { Controller, Param, Post } from "@nestjs/common";

import { VideoService } from "./video.service";

@Controller("projects/:id/videos")
export class VideoController {
    constructor(private service: VideoService) {}

    @Post()
    createJob(@Param("id") projectId: string) {
        return this.service.createVideo(projectId);
    }
}
