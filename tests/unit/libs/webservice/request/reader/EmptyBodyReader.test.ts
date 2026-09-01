import { describe, it, expect } from "vitest";
import { EmptyBodyReader } from "../../../../../../src/libs/webservice/request/reader/EmptyBodyReader.js";

describe("EmptyBodyReader", () => {
  const reader = new EmptyBodyReader()

  it("sets an empty description and no OpenAPI definition", () => {
    expect(reader.description).toEqual("")
    expect(reader.openApiDefinition).toBeUndefined()
  })

  it("always resolves to null data, regardless of input", async () => {
    const res = await reader.parse("some input")
    expect(res).toEqual({ isValid: true, data: null })
  })

  it("resolves to null data when called without input", async () => {
    const res = await reader.parse()
    expect(res).toEqual({ isValid: true, data: null })
  })
})
