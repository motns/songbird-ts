import { RequestBodyReader } from "./RequestBodyReader";
import { z, ZodTypeAny } from "zod";
import { ZodRequestBody } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { MimeType } from "../../../../enums/mime";
import { DataSanitizationResult } from "../../../../types/sanitization";
import { NonNullSanitiser } from "../../../sanitisation/NonNullSanitiser";
import { JSONStringSanitiser } from "../../../sanitisation/JSONStringSanitiser";
import { ZodSchemaSanitizer } from "../../../sanitisation/ZodSchemaSanitizer";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";

export class JsonBodyReader<
  Schema extends ZodTypeAny
> extends RequestBodyReader<string, z.infer<Schema>> {
  override readonly mimeType: MimeType = MimeType.JSON
  readonly schema: Schema

  constructor(schema: Schema, description?: string) {
    super(description || getOpenApiMetadata(schema)["description"] || "");
    this.schema = schema
  }

  override async parse(input?: string): Promise<
    DataSanitizationResult<z.infer<Schema>>
  > {
    return this.sanitise(input)
  }

  private async sanitise(input?: string): Promise<DataSanitizationResult<z.infer<Schema>>> {
    const strSR: DataSanitizationResult<string> = (new NonNullSanitiser<string>()).process(input)
    if (!strSR.isValid) {
      return strSR
    }

    const jsonSR: DataSanitizationResult<unknown> = (new JSONStringSanitiser()).process(strSR.data)
    if (!jsonSR.isValid) {
      return jsonSR
    }

    const schemaSR: DataSanitizationResult<z.infer<Schema>> = await (new ZodSchemaSanitizer(this.schema)).process(jsonSR.data)
    if (!schemaSR.isValid) {
      return schemaSR
    }

    return schemaSR.data
  }

  override getOpenApiDefinition(): ZodRequestBody | undefined {
    return {
      description: this.description,
      content: {
        [this.mimeType]: {
          schema: this.schema
        }
      },
      required: true,
    }
  }
}
