import { z } from "zod";
import { describe, it, expect } from "vitest";
import { JsonBodyReader } from "../../../../../../src/libs/webservice/request/reader/JsonBodyReader.js";
import { mimeTypes } from "../../../../../../src/enums/mime.js";

describe("JsonBodyReader", () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  })

  it("uses the provided description", () => {
    const reader = new JsonBodyReader(schema, "My description")
    expect(reader.description).toEqual("My description")
    expect(reader.openApiDefinition).toEqual({
      description: "My description",
      content: {
        [mimeTypes.JSON]: {
          schema: schema
        }
      },
      required: true,
    })
  })

  it("falls back to the schema's own description when none is provided", () => {
    const describedSchema = schema.meta({
      description: "From schema"
    })
    const reader = new JsonBodyReader(describedSchema)
    expect(reader.description).toEqual("From schema")
  })

  it("defaults description to an empty string when neither is provided", () => {
    const reader = new JsonBodyReader(schema)
    expect(reader.description).toEqual("")
  })

  it("returns parsed data for a valid JSON string matching the schema", async () => {
    const input = { id: 123, name: "Peter Parker" }
    const reader = new JsonBodyReader(schema)

    const res = await reader.parse(
      new Blob([JSON.stringify(input)])
    )
    expect(res.isValid).toEqual(true)
    if (res.isValid) {
      expect(res.data).toEqual(input)
    }
  })

  it("returns a validation error for null/undefined input", async () => {
    const reader = new JsonBodyReader(schema)

    const res = await reader.parse()
    expect(res.isValid).toEqual(false)
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        errors: [{
          code: "required",
          message: "Cannot be null",
        }]
      })
    }
  })

  it("returns a validation error for an invalid JSON string", async () => {
    const reader = new JsonBodyReader(schema)

    const res = await reader.parse(new Blob(["blurb"]))
    expect(res.isValid).toEqual(false)
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        errors: [{
          code: "invalid_json",
          message: `String is not valid JSON: SyntaxError: Unexpected token 'b', "blurb" is not valid JSON`,
        }]
      })
    }
  })

  it("returns a validation error for a JSON string that does not match the schema", async () => {
    const reader = new JsonBodyReader(schema)

    const res = await reader.parse(
      new Blob([JSON.stringify({ id: "not-a-number", name: "Peter Parker" })])
    )
    expect(res.isValid).toEqual(false)
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        properties: {
          id: {
            errors: [{
              code: "invalid_type",
              message: "Invalid input: expected number, received string",
              params: {
                expected: "number",
              }
            }]
          }
        }
      })
    }
  })
})
