import { z } from "zod";
import { describe, it, expect } from "vitest";
import { isEmptySchema } from "../../../src/libs/schemaUtils.js";

describe("isEmptySchema", () => {
  it("returns true for an object schema with no keys", () => {
    expect(isEmptySchema(z.object({}))).toEqual(true)
  })

  it("returns false for an object schema with keys", () => {
    expect(isEmptySchema(z.object({ id: z.string() }))).toEqual(false)
  })
})
