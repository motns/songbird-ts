import { JsonResponseWriter } from "../JsonResponseWriter";
import { errorSchema } from "./common";

export class JsonErrorMessageWriter extends JsonResponseWriter<typeof errorSchema> {
  constructor() {
    super(errorSchema, "Generic JSON error response format")
  }
}

export const jsonErrorMessageWriter = new JsonErrorMessageWriter()