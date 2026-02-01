import * as path from "node:path";
import * as dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";

dotenv.config({
    path: [
        path.resolve(process.cwd(), "../../.env"),
        path.resolve(process.cwd(), ".env"),
    ],
});

export const env = cleanEnv(process.env, {
    PORT: num(),
    DATABASE_URL: str(),
});
