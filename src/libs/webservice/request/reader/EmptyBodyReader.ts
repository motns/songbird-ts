import { RequestBodyReader } from "./RequestBodyReader.js";
import type { DataSanitizationResult } from "../../../../types/sanitization.js";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";

export class EmptyBodyReader extends RequestBodyReader<null> {
  readonly mimeType: MimeType = mimeTypes.TXT // Dummy value - won't really get used

  constructor() {
    super("", undefined)
  }

  parse(_input?: any): Promise<DataSanitizationResult<null>> {
    return Promise.resolve({ isValid: true, data: null });
  }
}

export const emptyBodyReader = new EmptyBodyReader()