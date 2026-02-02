import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type * as z from "zod";

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: z.ZodType) {}

    transform(value: unknown) {
        const { success, error, data } = this.schema.safeParse(value);
        if (!success) {
            throw new BadRequestException({
                message: error.issues[0].message,
            });
        }

        return data;
    }
}
