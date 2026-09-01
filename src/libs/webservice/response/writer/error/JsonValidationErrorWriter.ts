import { JsonResponseWriter } from "../JsonResponseWriter.js";
import { type RequestValidationErrors, requestValidationErrorsSchema } from "../../../../../types/sanitization.js";

export class JsonValidationErrorWriter extends JsonResponseWriter<RequestValidationErrors> {
  constructor() {
    super(requestValidationErrorsSchema, "");
  }
}

export const jsonValidationErrorWriter = new JsonValidationErrorWriter()