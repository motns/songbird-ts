import { describe, it, expect } from "vitest";
import { XMLErrorMessageWriter } from "../../../../../../../src/libs/webservice/response/writer/error/XMLErrorMessageWriter.js";
import { errorMessageSchema } from "../../../../../../../src/libs/webservice/response/writer/error/common.js";

describe("XMLErrorMessageWriter", () => {
  const writer = new XMLErrorMessageWriter()

  it("uses a fixed description", () => {
    expect(writer.description).toEqual("Generic XML error response format")
  })

  it("wraps the error message schema in a 'response' object", () => {
    expect(writer.schema.shape.response).toBe(errorMessageSchema)
  })

  it("serialises an error message to an XML string wrapped in a response element", () => {
    const input = { error: "Something went wrong" }
    expect(writer.serialise(input)).toEqual(
      '<?xml version="1.0"?><response><error>Something went wrong</error></response>'
    )
  })
})
