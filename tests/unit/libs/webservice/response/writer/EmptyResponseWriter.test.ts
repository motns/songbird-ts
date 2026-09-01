import { describe, it, expect } from "vitest";
import { EmptyResponseWriter } from "../../../../../../src/libs/webservice/response/writer/EmptyResponseWriter.js";

describe("EmptyResponseWriter", () => {
  const writer = new EmptyResponseWriter()

  it("sets an empty description and no OpenAPI definition", () => {
    expect(writer.description).toEqual("")
    expect(writer.openApiDefinition).toBeUndefined()
  })

  it("always serialises to null, regardless of input", () => {
    expect(writer.serialise("some input")).toEqual(null)
  })

  it("serialises to null when called without input", () => {
    expect(writer.serialise()).toEqual(null)
  })
})
