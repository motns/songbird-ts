import { describe, it, expect } from "vitest";
import { JsonValidationErrorWriter } from "../../../../../../../src/libs/webservice/response/writer/error/JsonValidationErrorWriter.js";
import { requestValidationErrorsSchema } from "../../../../../../../src/types/sanitization.js";

describe("JsonValidationErrorWriter", () => {
  const writer = new JsonValidationErrorWriter()

  it("uses an empty description", () => {
    expect(writer.description).toEqual("")
  })

  it("uses the request validation errors schema", () => {
    expect(writer.schema).toBe(requestValidationErrorsSchema)
  })

  it("serialises validation errors to a JSON string", () => {
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
    expect(writer.serialise(input)).toEqual(JSON.stringify(input))
  })
})
