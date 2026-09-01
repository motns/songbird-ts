import { ResponseBodyWriter } from "./ResponseBodyWriter.js";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";

export class EmptyResponseWriter extends ResponseBodyWriter<unknown, null> {
  override readonly mimeType: MimeType = mimeTypes.TXT; // Dummy value

  constructor() {
    super("", undefined);
  }

  override serialise(_input?: any): null {
    return null;
  }
}

export const emptyResponseWriter = new EmptyResponseWriter();
