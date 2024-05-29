import { MimeType } from "../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";

export abstract class ResponseBodyWriter<In, Out> {
  abstract readonly mimeType: MimeType
  readonly description: string

  protected constructor(description: string) {
    this.description = description
  }

  abstract serialise(input: In): Out
  abstract getOpenApiDefinition(): ZodContentObject | undefined
}