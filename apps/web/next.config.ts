import path from "node:path";
import * as dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
    path: [
        path.resolve(__dirname, "../../.env"),
        path.resolve(__dirname, ".env"),
    ],
});

const nextConfig: NextConfig = {
    reactCompiler: true,
    transpilePackages: ["@repo/ui"],
};

export default nextConfig;
