import { describe, it, expect } from "vitest";
import { Authorizer } from "../../../../../src/libs/webservice/authorization/Authorizer.js";
import { SanitizedRequest } from "../../../../../src/libs/webservice/request/SanitizedRequest.js";

describe("Authorizer", () => {
  const handlerFn = (
    req: SanitizedRequest<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      { role: string },
      Record<string, never>
    >,
  ): Promise<boolean> => Promise.resolve(req.auth.role === "admin");

  const authorizer = new Authorizer(handlerFn);

  it("authorizes when the handler returns true", async () => {
    const req = new SanitizedRequest("get", "/api/v1/users", {}, {}, {}, {}, { role: "admin" }, {});

    const res = await authorizer.isAuthorized(req);
    expect(res).toEqual(true);
  });

  it("does not authorize when the handler returns false", async () => {
    const req = new SanitizedRequest("get", "/api/v1/users", {}, {}, {}, {}, { role: "guest" }, {});

    const res = await authorizer.isAuthorized(req);
    expect(res).toEqual(false);
  });
});
