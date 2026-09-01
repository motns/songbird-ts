import { z } from "zod";
import { describe, it, expect } from "vitest";
import { TextResponseWriter } from "../../../../../../src/libs/webservice/response/writer/TextResponseWriter.js";
import { mimeTypes } from "../../../../../../src/enums/mime.js";
import type { ZodMediaTypeObject } from "@asteasolutions/zod-to-openapi";

describe("TextResponseWriter", () => {
  it("uses the provided description", () => {
    const writer = new TextResponseWriter("My description")
    expect(writer.description).toEqual("My description")
  })

  it("defaults description to an empty string when none is provided", () => {
    const writer = new TextResponseWriter()
    expect(writer.description).toEqual("")
  })

  it("sets an OpenAPI definition for a plain text schema", () => {
    const writer = new TextResponseWriter()
    const mediaType = writer.openApiDefinition?.[mimeTypes.TXT] as ZodMediaTypeObject | undefined
    expect(mediaType?.schema).toBeInstanceOf(z.ZodString)
  })

  it("serialises input by returning it unchanged", () => {
    const writer = new TextResponseWriter()
    expect(writer.serialise("hello world")).toEqual("hello world")
  })
})
