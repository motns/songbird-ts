import { describe, it, expect } from "vitest";
import { XMLValidationErrorWriter } from "../../../../../../../src/libs/webservice/response/writer/error/XMLValidationErrorWriter.js";
import { requestValidationErrorsSchema } from "../../../../../../../src/types/sanitization.js";

describe("XMLValidationErrorWriter", () => {
  const writer = new XMLValidationErrorWriter();

  it("uses an empty description", () => {
    expect(writer.description).toEqual("");
  });

  it("wraps the request validation errors schema in a 'response' object", () => {
    expect(writer.schema.shape.response).toBe(requestValidationErrorsSchema);
  });

  it("serialises validation errors to an XML string wrapped in a response element", () => {
    const input = {
      header: {
        properties: {
          "x-access-token": {
            errors: [
              {
                code: "invalid_type",
                message: "Invalid input: expected string, received undefined",
              },
            ],
          },
        },
      },
    };
    expect(writer.serialise(input)).toEqual(
      '<?xml version="1.0"?><response><header><properties><x-access-token><errors><code>invalid_type</code><message>Invalid input: expected string, received undefined</message></errors></x-access-token></properties></header></response>',
    );
  });
});
