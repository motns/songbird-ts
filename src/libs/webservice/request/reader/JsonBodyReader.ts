import { RequestBodyReader } from "./RequestBodyReader.js";
import { z } from "zod";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";
import type { DataSanitizationResult } from "../../../../types/sanitization.js";
import { NonNullSanitizer } from "../../../sanitization/NonNullSanitizer.js";
import { jsonStringSanitizer } from "../../../sanitization/JSONStringSanitizer.js";
import { ZodSchemaSanitizer } from "../../.././sanitization/ZodSchemaSanitizer.js";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";


export class JsonBodyReader<Out> extends RequestBodyReader<Out> {
  override readonly mimeType: MimeType = mimeTypes.JSON
  readonly schema: z.ZodType<Out, unknown>
  private readonly nonNullSanitiser: NonNullSanitizer<Blob> = new NonNullSanitizer<Blob>()
  private readonly zodSanitiser: ZodSchemaSanitizer<Out>

  constructor(
    schema: z.ZodType<Out, unknown>,
    description?: string | undefined
  ) {
    const desc = description || getOpenApiMetadata(schema)["description"] || ""
    super(
      desc,
      {
        description: desc,
        content: {
          [mimeTypes.JSON]: {
            schema: schema
          }
        },
        required: true,
      }
    )
    this.schema = schema
    this.zodSanitiser = new ZodSchemaSanitizer(schema)
  }

  override async parse(input?: Blob): Promise<DataSanitizationResult<Out>> {
    return this.sanitise(input)
  }

  private async sanitise(input?: Blob): Promise<DataSanitizationResult<Out>> {
    const nnSR: DataSanitizationResult<Blob> = this.nonNullSanitiser.process(input)
    if (!nnSR.isValid) {
      return nnSR
    }

    const jsonSR: DataSanitizationResult<unknown> = jsonStringSanitizer.process(await nnSR.data.text())
    if (!jsonSR.isValid) {
      return jsonSR
    }

    const schemaSR: DataSanitizationResult<Out> = await this.zodSanitiser.process(jsonSR.data)
    if (!schemaSR.isValid) {
      return schemaSR
    }

    return schemaSR
  }
}
