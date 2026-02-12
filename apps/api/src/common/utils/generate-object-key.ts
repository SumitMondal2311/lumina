import { extension } from "mime-types";

export function generateObjectKey({
    projectId,
    videoId,
    fileType,
}: {
    projectId: string;
    videoId: string;
    fileType: string;
}) {
    return `${projectId}/${videoId}/raw.${extension(fileType)}`;
}
