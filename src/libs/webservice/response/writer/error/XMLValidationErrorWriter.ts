import { requestValidationErrorsSchema } from "../../../../../types/sanitization";
import { XMLResponseWriter } from "../XMLResponseWriter";

export class XMLValidationErrorWriter extends XMLResponseWriter<typeof requestValidationErrorsSchema> {
  constructor() {
    super(requestValidationErrorsSchema, "");
  }
}

export const xmlValidationErrorWriter = new XMLValidationErrorWriter()