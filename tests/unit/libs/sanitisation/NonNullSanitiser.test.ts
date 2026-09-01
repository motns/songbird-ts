import { describe, it, expect } from "vitest";
import { NonNullSanitizer } from "../../../../src/libs/sanitization/NonNullSanitizer.js";

describe("NonNullSanitiser", () => {
  const sanitiser = new NonNullSanitizer()

  it("returns input for non-null type", () => {
    const res1 = sanitiser.process("hello")
    expect(res1.isValid).toEqual(true)
    if (res1.isValid) {
      expect(res1.data).toEqual("hello")
    }
  })

  it("returns validation error for null input", () => {
    const res = sanitiser.process(null)
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
})