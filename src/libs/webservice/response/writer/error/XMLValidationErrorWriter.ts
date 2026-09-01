import { type RequestValidationErrors, requestValidationErrorsSchema } from "../../../../../types/sanitization.js";
import { XMLResponseWriter } from "../XMLResponseWriter.js";

export class XMLValidationErrorWriter extends XMLResponseWriter<RequestValidationErrors> {
  constructor() {
    super(requestValidationErrorsSchema, "");
  }
}

export const xmlValidationErrorWriter = new XMLValidationErrorWriter()