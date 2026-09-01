import { describe, it, expect } from "vitest";
import { JsonErrorMessageWriter } from "../../../../../../../src/libs/webservice/response/writer/error/JsonErrorMessageWriter.js";
import { errorMessageSchema } from "../../../../../../../src/libs/webservice/response/writer/error/common.js";

describe("JsonErrorMessageWriter", () => {
  const writer = new JsonErrorMessageWriter();

  it("uses a fixed description", () => {
    expect(writer.description).toEqual("Generic JSON error response format");
  });

  it("uses the error message schema", () => {
    expect(writer.schema).toBe(errorMessageSchema);
  });

  it("serialises an error message to a JSON string", () => {
    const input = { error: "Something went wrong" };
    expect(writer.serialise(input)).toEqual(JSON.stringify(input));
  });
});
