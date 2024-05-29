import { ResponseBodyWriter } from "../ResponseBodyWriter";
import { MimeType } from "../../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { z } from "zod";
import { errorSchema } from "./common";

export class TextErrorMessageWriter extends ResponseBodyWriter<z.infer<typeof errorSchema>, string> {
  readonly mimeType: MimeType = MimeType.TXT

  constructor() {
    super("Generic plain text error response format")
  }

  serialise(input: z.infer<typeof errorSchema>): string {
    return input.error
  }

  protected generateOpenApiDefinition(): ZodContentObject | undefined {
    return {
      [this.mimeType]: {
        schema: z.string()
      }
    }
  }
}

export const textErrorMessageWriter = new TextErrorMessageWriter()