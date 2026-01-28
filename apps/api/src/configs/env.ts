import * as path from "node:path";
import * as dotenv from "dotenv";
import { cleanEnv, num } from "envalid";

dotenv.config({
    path: [
        path.resolve(process.cwd(), "../../.env"),
        path.resolve(process.cwd(), ".env"),
    ],
});

export const env = cleanEnv(process.env, {
    PORT: num(),
});
