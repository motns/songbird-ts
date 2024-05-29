import { ZodRequestBody } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { MimeType } from "../../../../enums/mime";
import { DataSanitizationResult } from "../../../../types/sanitization";

export abstract class RequestBodyReader<In, Out> {
  abstract readonly mimeType: MimeType
  readonly description: string

  protected constructor(description: string) {
    this.description = description
  }

  abstract parse(input?: In): Promise<DataSanitizationResult<Out>>
  //protected abstract generateOpenApiDefinition(): ZodRequestBody | undefined
  abstract getOpenApiDefinition(): ZodRequestBody | undefined
}
