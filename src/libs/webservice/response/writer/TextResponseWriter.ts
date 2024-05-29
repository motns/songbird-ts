import { ResponseBodyWriter } from "./ResponseBodyWriter";
import { z } from "zod";
import { MimeType } from "../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";

export class TextResponseWriter extends ResponseBodyWriter<string, string> {
  override readonly mimeType: MimeType = MimeType.TXT

  constructor(description: string) {
    super(description)
  }

  override serialise(input: string): string {
    return input
  }

  override getOpenApiDefinition(): ZodContentObject | undefined {
    return {
      [this.mimeType]: {
        schema: z.string()
      }
    }
  }
}