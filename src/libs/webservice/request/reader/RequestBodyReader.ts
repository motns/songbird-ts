import type { MimeType } from "../../../../enums/mime.js";
import type { DataSanitizationResult } from "../../../../types/sanitization.js";
import type { ZodRequestBody } from "@asteasolutions/zod-to-openapi";

export abstract class RequestBodyReader<Out> {
  abstract readonly mimeType: MimeType;
  readonly description: string;
  readonly openApiDefinition: ZodRequestBody | undefined;

  protected constructor(description: string, openApiDefinition: ZodRequestBody | undefined) {
    this.description = description;
    this.openApiDefinition = openApiDefinition;
  }

  abstract parse(input?: Blob): Promise<DataSanitizationResult<Out>>;
}
