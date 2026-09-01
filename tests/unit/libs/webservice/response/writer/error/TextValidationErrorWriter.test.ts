import { z } from "zod";
import { describe, it, expect } from "vitest";
import { TextValidationErrorWriter } from "../../../../../../../src/libs/webservice/response/writer/error/TextValidationErrorWriter.js";
import { mimeTypes } from "../../../../../../../src/enums/mime.js";
import type { ZodMediaTypeObject } from "@asteasolutions/zod-to-openapi";

describe("TextValidationErrorWriter", () => {
  const writer = new TextValidationErrorWriter()

  it("uses a fixed description", () => {
    expect(writer.description).toEqual("Validation error response output in plain text, formatted by YAML")
  })

  it("sets an OpenAPI definition for a plain text schema", () => {
    const mediaType = writer.openApiDefinition?.[mimeTypes.TXT] as ZodMediaTypeObject | undefined
    expect(mediaType?.schema).toBeInstanceOf(z.ZodString)
  })

  it("serialises validation errors to a YAML-formatted string", () => {
    const input = {
      header: {
        properties: {
          "x-access-token": {
            errors: [{
              code: "invalid_type",
              message: "Invalid input: expected string, received undefined",
            }]
          }
        }
      }
    }
    expect(writer.serialise(input)).toEqual(
`header:
  properties:
    x-access-token:
      errors:
        - code: invalid_type
          message: "Invalid input: expected string, received undefined"
`
    )
  })
})
