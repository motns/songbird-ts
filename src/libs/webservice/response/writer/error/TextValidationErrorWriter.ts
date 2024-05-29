import { RequestValidationErrors, requestValidationErrorsSchema } from "../../../../../types/sanitization";
import { ResponseBodyWriter } from "../ResponseBodyWriter";
import { MimeType } from "../../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { z } from "zod";
import YAML from "yaml"

export class TextValidationErrorWriter extends ResponseBodyWriter<RequestValidationErrors, string> {
  readonly mimeType: MimeType = MimeType.TXT

  constructor() {
    super("Validation error response output in plain text, formatted by YAML")
  }

  serialise(input: RequestValidationErrors): string {
    return YAML.stringify(input)
  }

  protected generateOpenApiDefinition(): ZodContentObject | undefined {
    return {
      [this.mimeType]: {
        schema: z.string()
      }
    }
  }
}

export const textValidationErrorWriter = new TextValidationErrorWriter()