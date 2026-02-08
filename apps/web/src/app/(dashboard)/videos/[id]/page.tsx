"use client";

import type { Video } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import type {
    CreateUploadUrlSchema,
    UploadCompleteSuccessSchema,
} from "@repo/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { apiClient } from "@/lib/api-client";

export default function Page() {
    const [video, setVideo] = React.useState<File | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const queryClient = useQueryClient();

    const params = useParams();
    const videoId = params.id;
    const router = useRouter();

    const { data, isError, isSuccess } = useQuery<
        Video,
        AxiosError<{ message: string }>
    >({
        queryKey: [`videos:${videoId}`],
        retry: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            return (await apiClient.get(`videos/${videoId}`)).data;
        },
    });

    const {
        data: videoStatusData,
        isError: isVideoStatusError,
        isSuccess: isVideoStatusSuccess,
    } = useQuery<
        | {
              status: "PROCESSING";
              progress: number;
          }
        | {
              status: "UPLOADING" | "READY" | "FAILED";
          },
        AxiosError<{ message: string }>
    >({
        queryKey: [`videos:${videoId}:status`],
        retry: 0,
        refetchOnWindowFocus: false,
        refetchInterval: (query) =>
            query.state.data?.status === "UPLOADING" ||
            query.state.data?.status === "READY" ||
            query.state.data?.status === "FAILED"
                ? false
                : 1000,
        queryFn: async () => {
            return (await apiClient.get(`videos/${videoId}/status`)).data;
        },
    });

    React.useEffect(() => {
        if (
            videoStatusData?.status === "READY" ||
            videoStatusData?.status === "FAILED"
        ) {
            queryClient.invalidateQueries({ queryKey: [`videos:${videoId}`] });
        }
    }, [videoStatusData, queryClient, videoId]);

    React.useEffect(() => {
        if (isError || isVideoStatusError) {
            router.replace("/");
        }
    }, [isError, isVideoStatusError, router]);

    const { mutateAsync: createUploadUrl } = useMutation<
        { objectKey: string; preSignedUrl: string },
        unknown,
        CreateUploadUrlSchema
    >({
        mutationFn: async (data: CreateUploadUrlSchema) => {
            return (
                await apiClient.post<{
                    objectKey: string;
                    preSignedUrl: string;
                }>(`videos/${videoId}/upload-url`, data)
            ).data;
        },
        onError: () => {
            setUploading(false);
        },
    });

    const { data: playbackUrlData, isSuccess: isPlaybackUrlSuccess } = useQuery<
        { playbackUrl: string; expiresIn: number },
        AxiosError<{ message: string }>
    >({
        queryKey: [`videos:${videoId}:playback-url`],
        retry: 0,
        enabled: isVideoStatusSuccess && videoStatusData.status === "READY",
        refetchOnWindowFocus: false,
        queryFn: async () => {
            return (await apiClient.get(`videos/${videoId}/playback-url`)).data;
        },
    });

    React.useEffect(() => {
        if (isPlaybackUrlSuccess) {
            console.log(playbackUrlData.playbackUrl);
        }
    }, [isPlaybackUrlSuccess, playbackUrlData]);

    const { mutateAsync: uploadComplete } = useMutation<
        Video,
        unknown,
        UploadCompleteSuccessSchema
    >({
        mutationFn: async (data: UploadCompleteSuccessSchema) => {
            return (
                await apiClient.post<Video>(
                    `videos/${videoId}/upload-complete`,
                    data,
                )
            ).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`videos:${videoId}`] });
            queryClient.invalidateQueries({
                queryKey: [`videos:${videoId}:status`],
            });
        },
        onError: () => {
            alert("Failed to notify upload completion message to the server");
        },
    });

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="border p-2 grid">
                    <h1 className="underline font-semibold text-lg">
                        Video details:
                    </h1>
                    <span>ProjectId: {data.projectId}</span>
                    <span>Id: {data.id}</span>
                    <span>Title: {data.title}</span>
                    <span>Status: {data.status}</span>
                </div>
                {data.status === "UPLOADING" && (
                    <input
                        type="file"
                        className="border cursor-pointer"
                        onChange={(e) => {
                            if (e.target.files) {
                                setVideo(e.target.files[0]);
                            }
                        }}
                    />
                )}
                {isVideoStatusSuccess ? (
                    videoStatusData.status === "UPLOADING" ? (
                        <Button
                            disabled={uploading}
                            className="cursor-pointer"
                            onClick={async () => {
                                if (!video)
                                    return alert("Please select a video");

                                setUploading(true);

                                try {
                                    const uploadConfig = await createUploadUrl({
                                        videoType:
                                            video.type as CreateUploadUrlSchema["videoType"],
                                        videoSize: video.size,
                                    });

                                    const res = await fetch(
                                        uploadConfig.preSignedUrl,
                                        {
                                            method: "PUT",
                                            body: video,
                                            headers: {
                                                "Content-Type": video.type,
                                            },
                                        },
                                    );

                                    if (!res.ok) {
                                        alert("S3 upload failed!");
                                        return;
                                    }

                                    await uploadComplete({
                                        objectKey: uploadConfig.objectKey,
                                    });
                                } catch {
                                    alert("Failed the upload process!!!");
                                } finally {
                                    setUploading(false);
                                }
                            }}
                        >
                            {uploading ? (
                                "Uploading..."
                            ) : (
                                <>
                                    <Upload />
                                    Upload video
                                </>
                            )}
                        </Button>
                    ) : videoStatusData.status === "PROCESSING" ? (
                        <Progress
                            value={videoStatusData.progress}
                            className="w-80"
                        />
                    ) : videoStatusData.status === "READY" ? (
                        <div className="aspect-video w-full xl:w-120 px-6">
                            {isPlaybackUrlSuccess ? (
                                <video
                                    key={playbackUrlData.playbackUrl}
                                    src={playbackUrlData.playbackUrl}
                                    controls
                                    className="h-full w-full rounded-md ring-2 ring-blue-500"
                                />
                            ) : (
                                <p>Loading playback...</p>
                            )}
                        </div>
                    ) : null
                ) : null}
            </div>
        );
    }

    return null;
}
