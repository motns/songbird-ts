import { ResponseBodyWriter } from "./ResponseBodyWriter.js";
import { z } from "zod";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";

export class TextResponseWriter extends ResponseBodyWriter<string, string> {
  override readonly mimeType: MimeType = mimeTypes.TXT

  constructor(description?: string) {
    super(
      description || "",
      {
        [mimeTypes.TXT]: {
          schema: z.string()
        }
      }
    )
  }

  override serialise(input: string): string {
    return input
  }
}