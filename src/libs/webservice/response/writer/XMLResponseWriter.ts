import { ResponseBodyWriter } from "./ResponseBodyWriter.js";
import { z } from "zod";
import { type MimeType, mimeTypes } from "../../../../enums/mime.js";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";
import { create } from "xmlbuilder2";

export class XMLResponseWriter<In> extends ResponseBodyWriter<In, string> {
  override readonly mimeType: MimeType = mimeTypes.XML
  readonly schema: z.ZodObject<{response: z.ZodType<In, unknown>}>

  constructor(
    schema: z.ZodType<In, unknown>,
    description?: string
  ) {
    const s = z.object({
      "response" : schema
    })

    super(
      description || getOpenApiMetadata(schema)["description"] || "",
      {
        [mimeTypes.XML]: {
          schema: s
        }
      }
    )
    this.schema = s
  }

  override serialise(input: In): string {
    const response: {response: In} = { response: input }
    return create(
      { version: '1.0' },
      response
    ).end()
  }
}