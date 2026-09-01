import type { MimeType } from "../../../../enums/mime.js";
import type { ZodContentObject } from "@asteasolutions/zod-to-openapi";

export abstract class ResponseBodyWriter<In, Out> {
  abstract readonly mimeType: MimeType
  readonly description: string
  readonly openApiDefinition: ZodContentObject | undefined

  protected constructor(
    description: string,
    openApiDefinition: ZodContentObject | undefined
  ) {
    this.description = description
    this.openApiDefinition = openApiDefinition
  }

  abstract serialise(input: In): Out
}