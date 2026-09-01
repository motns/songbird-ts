import { describe, it, expect } from "vitest";
import { JSONStringSanitizer } from "../../../../src/libs/sanitization/JSONStringSanitizer.js";

describe("JSONStringSanitiser", () => {
  const sanitiser = new JSONStringSanitizer()

  it("returns parsed object for a valid json string", () => {
    const o = {
      "a": 1,
      "b": "2",
      "c": true
    }
    const validStr = JSON.stringify(o)
    const res = sanitiser.process(validStr)
    expect(res.isValid).toEqual(true)
    if (res.isValid) {
      expect(res.data).toEqual(o)
    }
  })

  it("returns validation error for an invalid json string", () => {
    const res = sanitiser.process("blurb")
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
})