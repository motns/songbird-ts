import { JsonResponseWriter } from "../JsonResponseWriter";
import { errorSchema } from "./common";
import { XMLResponseWriter } from "../XMLResponseWriter";

export class XMLErrorMessageWriter extends XMLResponseWriter<typeof errorSchema> {
  constructor() {
    super(errorSchema, "Generic XML error response format")
  }
}

export const xmlErrorMessageWriter = new XMLErrorMessageWriter()