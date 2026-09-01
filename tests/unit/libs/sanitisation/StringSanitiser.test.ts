import { describe, it, expect } from "vitest";
import { StringSanitizer } from "../../../../src/libs/sanitization/StringSanitizer.js";

describe("StringSanitiser", () => {
  const sanitiser = new StringSanitizer();

  it("returns input for non-null type", () => {
    const res1 = sanitiser.process("hello");
    expect(res1.isValid).toEqual(true);
    if (res1.isValid) {
      expect(res1.data).toEqual("hello");
    }
  });

  it("returns validation error for non-string input", () => {
    const res = sanitiser.process(12);
    expect(res.isValid).toEqual(false);
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        errors: [
          {
            code: "not_string",
            message: "Has to be a string",
          },
        ],
      });
    }
  });
});
