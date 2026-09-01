import { describe, it, expect } from "vitest";
import { mergeComplexTypeValidationErrors } from "../../../src/libs/validation.js";

describe("mergeComplexTypeValidationErrors", () => {
  it("concatenates top-level errors arrays", () => {
    const a = { errors: [{ code: "a", message: "A" }] };
    const b = { errors: [{ code: "b", message: "B" }] };

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      errors: [
        { code: "a", message: "A" },
        { code: "b", message: "B" },
      ],
    });
  });

  it("merges properties with distinct keys", () => {
    const a = { properties: { name: { errors: [{ code: "a", message: "A" }] } } };
    const b = { properties: { age: { errors: [{ code: "b", message: "B" }] } } };

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      properties: {
        name: { errors: [{ code: "a", message: "A" }] },
        age: { errors: [{ code: "b", message: "B" }] },
      },
    });
  });

  it("concatenates errors arrays for a shared property key", () => {
    const a = { properties: { name: { errors: [{ code: "a", message: "A" }] } } };
    const b = { properties: { name: { errors: [{ code: "b", message: "B" }] } } };

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      properties: {
        name: {
          errors: [
            { code: "a", message: "A" },
            { code: "b", message: "B" },
          ],
        },
      },
    });
  });

  it("merges items, concatenating errors for a shared index", () => {
    const a = { items: { 0: { errors: [{ code: "a", message: "A" }] } } };
    const b = {
      items: {
        0: { errors: [{ code: "b", message: "B" }] },
        1: { errors: [{ code: "c", message: "C" }] },
      },
    };

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      items: {
        0: {
          errors: [
            { code: "a", message: "A" },
            { code: "b", message: "B" },
          ],
        },
        1: { errors: [{ code: "c", message: "C" }] },
      },
    });
  });

  it("returns b's errors when a has none", () => {
    const a = {};
    const b = { errors: [{ code: "b", message: "B" }] };

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      errors: [{ code: "b", message: "B" }],
    });
  });

  it("returns a's errors when b has none", () => {
    const a = { errors: [{ code: "a", message: "A" }] };
    const b = {};

    expect(mergeComplexTypeValidationErrors(a, b)).toEqual({
      errors: [{ code: "a", message: "A" }],
    });
  });

  it("does not mutate its inputs", () => {
    const a = { properties: { name: { errors: [{ code: "a", message: "A" }] } } };
    const b = { properties: { name: { errors: [{ code: "b", message: "B" }] } } };
    const aClone = structuredClone(a);
    const bClone = structuredClone(b);

    mergeComplexTypeValidationErrors(a, b);

    expect(a).toEqual(aClone);
    expect(b).toEqual(bClone);
  });
});
