import { ResponseBodyWriter } from "./ResponseBodyWriter.js";
import { z } from "zod";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";

export class JsonResponseWriter<In> extends ResponseBodyWriter<In, string> {
  override readonly mimeType: MimeType = mimeTypes.JSON;
  // The schema is only used for OpenAPI documentation, which is why it takes the
  // writer's `In` type as its output type.
  readonly schema: z.ZodType<In, unknown>;

  constructor(schema: z.ZodType<In, unknown>, description?: string) {
    super(description || getOpenApiMetadata(schema)["description"] || "", {
      [mimeTypes.JSON]: { schema },
    });
    this.schema = schema;
  }

  override serialise(input: In): string {
    return JSON.stringify(input);
  }
}
