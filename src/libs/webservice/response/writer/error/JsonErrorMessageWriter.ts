import { JsonResponseWriter } from "../JsonResponseWriter.js";
import { type ErrorMessage, errorMessageSchema } from "./common.js";

export class JsonErrorMessageWriter extends JsonResponseWriter<ErrorMessage> {
  constructor() {
    super(errorMessageSchema, "Generic JSON error response format");
  }
}

export const jsonErrorMessageWriter = new JsonErrorMessageWriter();
