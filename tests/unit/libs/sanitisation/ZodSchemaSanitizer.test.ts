import { z } from "zod";
import { describe, it, expect } from "vitest";
import { ZodSchemaSanitizer } from "../../../../src/libs/./sanitization/ZodSchemaSanitizer.js";

describe("ZodSchemaSanitizer", () => {
  it("returns parsed value for valid object", async () => {
    const schema = z.object({
      id: z.number(),
      name: z.string().trim(),
    });
    const input = {
      id: 123,
      name: "   Peter Parker   ",
    };
    const output = {
      id: 123,
      name: "Peter Parker",
    };
    const sanitiser = new ZodSchemaSanitizer(schema);

    const res1 = await sanitiser.process(input);
    expect(res1.isValid).toEqual(true);
    if (res1.isValid) {
      expect(res1.data).toEqual(output);
    }
  });

  it("returns validation error for single-level invalid object", async () => {
    const schema = z.object({
      id: z.number(),
      name: z.string().trim(),
    });
    const input = {
      id: false,
      name: "   Peter Parker   ",
    };
    const sanitiser = new ZodSchemaSanitizer(schema);

    const res = await sanitiser.process(input);
    expect(res.isValid).toEqual(false);
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        properties: {
          id: {
            errors: [
              {
                code: "invalid_type",
                message: "Invalid input: expected number, received boolean",
                params: {
                  expected: "number",
                },
              },
            ],
          },
        },
      });
    }
  });

  it("returns validation error for complex nested object", async () => {
    const schema = z.object({
      id: z.number(),
      name: z.string().trim().max(5),
      secret: z.object({
        identity: z.string().trim(),
        saves: z.number().int().min(100),
      }),
      friends: z.array(
        z.object({
          id: z.number(),
          name: z.string().trim().min(10),
        }),
      ),
    });

    const input = {
      id: 123,
      name: "Peter Parker",
      secret: {
        identity: "Spider-Man",
        saves: 5,
      },
      friends: [
        {
          id: 456,
          name: "Bruce Banner",
        },
        {
          id: 789,
          name: "Mary Jane",
        },
      ],
    };
    const sanitiser = new ZodSchemaSanitizer(schema);

    const res = await sanitiser.process(input);
    expect(res.isValid).toEqual(false);
    if (!res.isValid) {
      expect(res.validationErrors).toEqual({
        properties: {
          name: {
            errors: [
              {
                code: "too_big",
                message: "Too big: expected string to have <=5 characters",
                params: {
                  maximum: 5,
                  inclusive: true,
                  origin: "string",
                },
              },
            ],
          },
          secret: {
            properties: {
              saves: {
                errors: [
                  {
                    code: "too_small",
                    message: "Too small: expected number to be >=100",
                    params: {
                      minimum: 100,
                      inclusive: true,
                      origin: "number",
                    },
                  },
                ],
              },
            },
          },
          friends: {
            items: {
              1: {
                properties: {
                  name: {
                    errors: [
                      {
                        code: "too_small",
                        message: "Too small: expected string to have >=10 characters",
                        params: {
                          minimum: 10,
                          inclusive: true,
                          origin: "string",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      });
    }
  });
});
