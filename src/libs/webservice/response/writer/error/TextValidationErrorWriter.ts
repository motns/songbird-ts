import type { RequestValidationErrors } from "../../../../../types/sanitization.js";
import { ResponseBodyWriter } from "../ResponseBodyWriter.js";
import { type MimeType, mimeTypes } from "../../../../../enums/mime.js";
import * as z from "zod";
import YAML from "yaml"

export class TextValidationErrorWriter extends ResponseBodyWriter<RequestValidationErrors, string> {
  readonly mimeType: MimeType = mimeTypes.TXT

  constructor() {
    super(
      "Validation error response output in plain text, formatted by YAML",
      {
        [mimeTypes.TXT]: {
          schema: z.string()
        }
      }
    )
  }

  override serialise(input: RequestValidationErrors): string {
    return YAML.stringify(input)
  }
}

export const textValidationErrorWriter = new TextValidationErrorWriter()