import { ResponseBodyWriter } from "./ResponseBodyWriter";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { MimeType } from "../../../../enums/mime";

export class EmptyResponseWriter extends ResponseBodyWriter<any, null> {
  override readonly mimeType: MimeType = MimeType.TXT // Dummy value

  constructor() {
    super("");
  }

  override serialise(data: any): null {
    return null;
  }

  override getOpenApiDefinition(): ZodContentObject | undefined {
    return undefined;
  }
}

export const emptyResponseWriter = new EmptyResponseWriter()
