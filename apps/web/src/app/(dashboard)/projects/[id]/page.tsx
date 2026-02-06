"use client";

import { Video } from "@repo/database";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { apiClient } from "@/lib/api-client";

export default function Page() {
    const params = useParams();
    const projectId = params.id;
    const router = useRouter();

    const { data, isError, isSuccess } = useQuery<
        Array<Pick<Video, "id" | "title" | "status">>,
        AxiosError<{ message: string }>
    >({
        queryKey: [`${projectId}:videos`],
        retry: 0,
        queryFn: async () => {
            return (await apiClient.get(`projects/${projectId}/videos`)).data;
        },
    });

    React.useEffect(() => {
        if (isError) {
            router.replace("/");
        }
    }, [isError, router]);

    const {
        mutate,
        isPending,
        isSuccess: isCreatevideoSuccess,
    } = useMutation<Video, unknown>({
        mutationFn: async () => {
            return (
                await apiClient.post(`projects/${projectId}/videos`, undefined)
            ).data;
        },
    });

    if (isSuccess) {
        return (
            <div className="h-screen p-4 grid auto-rows-min grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 relative overflow-y-scroll">
                {isPending || isCreatevideoSuccess ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/10">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : null}
                {data.map((video) => (
                    <Link
                        key={video.id}
                        href={`/videos/${video.id}`}
                        className="border p-2 cursor-pointer aspect-video rounded-md grid hover:shadow-inner transition-all hover:ring"
                    >
                        <span className="underline">Video details</span>
                        <span>ID: {video.id}</span>
                        <span>Title: {video.title}</span>
                        <span>Status: {video.status}</span>
                    </Link>
                ))}
                {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
                {/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                    onClick={() =>
                        mutate(undefined, {
                            onSuccess: ({ id: videoId }) =>
                                router.push(`/videos/${videoId}`),
                        })
                    }
                    className="aspect-video bg-gray-50 transition-all cursor-pointer text-black hover:bg-gray-100 rounded-md border grid place-items-center"
                >
                    Add video
                </div>
            </div>
        );
    }

    return null;
}
