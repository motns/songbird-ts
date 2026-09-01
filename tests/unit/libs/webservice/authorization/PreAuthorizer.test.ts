import { describe, it, expect } from "vitest";
import { PreAuthorizer } from "../../../../../src/libs/webservice/authorization/PreAuthorizer.js";

describe("PreAuthorizer", () => {
  const handlerFn = (auth: { role: string }): boolean => auth.role === "admin"

  const authorizer = new PreAuthorizer(handlerFn, ["read:users"])

  it("authorizes when the handler returns true", () => {
    const res = authorizer.isAuthorized({ role: "admin" })
    expect(res).toEqual(true)
  })

  it("does not authorize when the handler returns false", () => {
    const res = authorizer.isAuthorized({ role: "guest" })
    expect(res).toEqual(false)
  })
})
