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
    AWS_ACCESS_KEY_ID: str(),
    AWS_SECRET_ACCESS_KEY: str(),
    AWS_REGION: str(),
    AWS_S3_BUCKET_NAME: str(),
});
