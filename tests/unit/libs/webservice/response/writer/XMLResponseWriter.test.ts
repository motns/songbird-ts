import { z } from "zod";
import { describe, it, expect } from "vitest";
import { XMLResponseWriter } from "../../../../../../src/libs/webservice/response/writer/XMLResponseWriter.js";
import { mimeTypes } from "../../../../../../src/enums/mime.js";
import type { ZodMediaTypeObject } from "@asteasolutions/zod-to-openapi";

describe("XMLResponseWriter", () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  })

  it("uses the provided description", () => {
    const writer = new XMLResponseWriter(schema, "My description")
    expect(writer.description).toEqual("My description")

    const mediaType = writer.openApiDefinition?.[mimeTypes.XML] as ZodMediaTypeObject | undefined
    expect(mediaType?.schema).toBe(writer.schema)
  })

  it("falls back to the schema's own description when none is provided", () => {
    const describedSchema = schema.meta({
      description: "From schema"
    })
    const writer = new XMLResponseWriter(describedSchema)
    expect(writer.description).toEqual("From schema")
  })

  it("defaults description to an empty string when neither is provided", () => {
    const writer = new XMLResponseWriter(schema)
    expect(writer.description).toEqual("")
  })

  it("wraps the schema in a 'response' object", () => {
    const writer = new XMLResponseWriter(schema)
    expect(writer.schema.shape.response).toBe(schema)
  })

  it("serialises input to an XML string wrapped in a response element", () => {
    const writer = new XMLResponseWriter(schema)
    const input = { id: 123, name: "Peter Parker" }

    expect(writer.serialise(input)).toEqual(
      '<?xml version="1.0"?><response><id>123</id><name>Peter Parker</name></response>'
    )
  })
})
