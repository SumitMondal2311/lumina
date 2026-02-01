import * as path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

import { PrismaClient } from "./generated/prisma/client";

dotenv.config({
    path: path.resolve(__dirname, "../../../.env"),
});

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
