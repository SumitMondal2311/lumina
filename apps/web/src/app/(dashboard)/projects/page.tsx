// const { data } = useQuery<
//         Array<
//             Omit<ProjectMember, "userId" | "projectId"> & {
//                 project: Project;
//             }
//         >,
//         AxiosError<{ message: string }>,
//         void
//     >({
//         queryKey: ["projects"],
//         queryFn: () => {
//             return apiClient.get()
//         }
//     });

export default function Page() {
    return (
        <div className="min-h-screen grid place-items-center">
            Projects list
        </div>
    );
}
