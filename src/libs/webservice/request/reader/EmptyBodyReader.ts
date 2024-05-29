import { RequestBodyReader } from "./RequestBodyReader";
import { DataSanitizationResult } from "../../../../types/sanitization";
import { ZodRequestBody } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { MimeType } from "../../../../enums/mime";

export class EmptyBodyReader extends RequestBodyReader<any, null> {
  readonly mimeType: MimeType = MimeType.TXT // Dummy value - won't really get used

  constructor() {
    super("");
  }

  parse(): Promise<DataSanitizationResult<null>> {
    return Promise.resolve({ isValid: true, data: null });
  }

  override getOpenApiDefinition(): ZodRequestBody | undefined {
    return undefined
  }
}

export const emptyBodyReader = new EmptyBodyReader()