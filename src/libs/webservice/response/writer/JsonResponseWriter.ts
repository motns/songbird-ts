import { ResponseBodyWriter } from "./ResponseBodyWriter";
import { z, ZodTypeAny } from "zod";
import { MimeType } from "../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";

export class JsonResponseWriter<
  Schema extends ZodTypeAny
> extends ResponseBodyWriter<z.infer<Schema>, string> {
  override readonly mimeType: MimeType = MimeType.JSON
  readonly schema: Schema

  constructor(schema: Schema, description?: string) {
    super(description || getOpenApiMetadata(schema)["description"] || "")
    this.schema = schema
  }

  override serialise(input: z.infer<Schema>): string {
    return JSON.stringify(input);
  }

  override getOpenApiDefinition(): ZodContentObject | undefined {
    return {
      [this.mimeType]: {
        schema: this.schema
      }
    }
  }
}