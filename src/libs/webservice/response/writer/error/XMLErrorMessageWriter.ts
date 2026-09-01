import { type ErrorMessage, errorMessageSchema } from "./common.js";
import { XMLResponseWriter } from "../XMLResponseWriter.js";

export class XMLErrorMessageWriter extends XMLResponseWriter<ErrorMessage> {
  constructor() {
    super(errorMessageSchema, "Generic XML error response format")
  }
}

export const xmlErrorMessageWriter = new XMLErrorMessageWriter()