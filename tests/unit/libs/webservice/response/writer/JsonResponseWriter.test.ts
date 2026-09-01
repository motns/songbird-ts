import { z } from "zod";
import { describe, it, expect } from "vitest";
import { JsonResponseWriter } from "../../../../../../src/libs/webservice/response/writer/JsonResponseWriter.js";
import { mimeTypes } from "../../../../../../src/enums/mime.js";

describe("JsonResponseWriter", () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  })

  it("uses the provided description", () => {
    const writer = new JsonResponseWriter(schema, "My description")
    expect(writer.description).toEqual("My description")
    expect(writer.openApiDefinition).toEqual({
      [mimeTypes.JSON]: {
        schema: schema
      }
    })
  })

  it("falls back to the schema's own description when none is provided", () => {
    const describedSchema = schema.meta({
      description: "From schema"
    })
    const writer = new JsonResponseWriter(describedSchema)
    expect(writer.description).toEqual("From schema")
  })

  it("defaults description to an empty string when neither is provided", () => {
    const writer = new JsonResponseWriter(schema)
    expect(writer.description).toEqual("")
  })

  it("serialises input to a JSON string", () => {
    const writer = new JsonResponseWriter(schema)
    const input = { id: 123, name: "Peter Parker" }

    expect(writer.serialise(input)).toEqual(JSON.stringify(input))
  })
})
