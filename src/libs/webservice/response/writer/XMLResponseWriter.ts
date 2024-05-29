import { ResponseBodyWriter } from "./ResponseBodyWriter";
import { z, ZodTypeAny } from "zod";
import { MimeType } from "../../../../enums/mime";
import { ZodContentObject } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { getOpenApiMetadata } from "@asteasolutions/zod-to-openapi";
import XMLBuilder from "xmlbuilder2";

export class XMLResponseWriter<
  Schema extends ZodTypeAny
> extends ResponseBodyWriter<z.infer<Schema>, string> {
  override readonly mimeType: MimeType = MimeType.TXT
  readonly schema: Schema

  constructor(schema: Schema, description?: string) {
    super(description || getOpenApiMetadata(schema)["description"] || "")
    this.schema = schema
  }

  override serialise(input: z.infer<Schema>): string {
    return XMLBuilder.create(input).end()
  }

  override getOpenApiDefinition(): ZodContentObject | undefined {
    return {
      [this.mimeType]: {
        schema: this.schema
      }
    }
  }
}