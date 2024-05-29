import { JsonResponseWriter } from "../JsonResponseWriter";
import { requestValidationErrorsSchema } from "../../../../../types/sanitization";

export class JsonValidationErrorWriter extends JsonResponseWriter<typeof requestValidationErrorsSchema> {
  constructor() {
    super(requestValidationErrorsSchema, "");
  }
}

export const jsonValidationErrorWriter = new JsonValidationErrorWriter()