import { z } from "zod";
import { describe, it, expect } from "vitest";
import { TextErrorMessageWriter } from "../../../../../../../src/libs/webservice/response/writer/error/TextErrorMessageWriter.js";
import { mimeTypes } from "../../../../../../../src/enums/mime.js";
import type { ZodMediaTypeObject } from "@asteasolutions/zod-to-openapi";

describe("TextErrorMessageWriter", () => {
  const writer = new TextErrorMessageWriter()

  it("uses a fixed description", () => {
    expect(writer.description).toEqual("Generic plain text error response format")
  })

  it("sets an OpenAPI definition for a plain text schema", () => {
    const mediaType = writer.openApiDefinition?.[mimeTypes.TXT] as ZodMediaTypeObject | undefined
    expect(mediaType?.schema).toBeInstanceOf(z.ZodString)
  })

  it("serialises an error message by returning its error string", () => {
    expect(writer.serialise({ error: "Something went wrong" })).toEqual("Something went wrong")
  })
})
