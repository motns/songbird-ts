import { ResponseBodyWriter } from "../ResponseBodyWriter.js";
import { type MimeType, mimeTypes } from "../../../../../enums/mime.js";
import { z } from "zod";
import { type ErrorMessage } from "./common.js";

export class TextErrorMessageWriter extends ResponseBodyWriter<ErrorMessage, string> {
  override readonly mimeType: MimeType = mimeTypes.TXT

  constructor() {
    super(
      "Generic plain text error response format",
      {
        [mimeTypes.TXT]: {
          schema: z.string()
        }
      }
    )
  }

  override serialise(input: ErrorMessage): string {
    return input.error
  }
}

export const textErrorMessageWriter = new TextErrorMessageWriter()