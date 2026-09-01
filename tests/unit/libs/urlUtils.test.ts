import { describe, it, expect } from "vitest";
import {
  routeConcat,
  routePatternToOpenAPIPath,
  stripStringPrefix,
  stripStringSuffix
} from "../../../src/libs/urlUtils.js";

describe("routePatternToOpenAPIPath", () => {
  it("returns the path unchanged when there are no params", () => {
    expect(routePatternToOpenAPIPath("/users")).toEqual("/users")
  })

  it("converts an untyped param to OpenAPI path param syntax", () => {
    expect(routePatternToOpenAPIPath("/users/:user_id")).toEqual("/users/{user_id}")
  })

  it("strips the type annotation from a typed param", () => {
    expect(routePatternToOpenAPIPath("/users/:user_id<number>")).toEqual("/users/{user_id}")
  })

  it("converts multiple params, typed and untyped", () => {
    expect(routePatternToOpenAPIPath("/users/:user_id<number>/posts/:post_id")).toEqual("/users/{user_id}/posts/{post_id}")
  })
})

describe("stripStringPrefix", () => {
  it("returns the input unchanged when it does not start with the prefix", () => {
    expect(stripStringPrefix("users", "/")).toEqual("users")
  })

  it("strips a single-character prefix", () => {
    expect(stripStringPrefix("/users", "/")).toEqual("users")
  })

  it("strips a multi-character prefix", () => {
    expect(stripStringPrefix("/users", "/u")).toEqual("sers")
  })

  it("returns an empty string for empty input and prefix", () => {
    expect(stripStringPrefix("", "")).toEqual("")
  })
})

describe("stripStringSuffix", () => {
  it("returns the input unchanged when it does not end with the suffix", () => {
    expect(stripStringSuffix("posts", "/")).toEqual("posts")
  })

  it("strips a single-character suffix", () => {
    expect(stripStringSuffix("posts/", "/")).toEqual("posts")
  })

  it("strips a multi-character suffix", () => {
    expect(stripStringSuffix("posts/", "s/")).toEqual("post")
  })

  it("returns an empty string for empty input and suffix", () => {
    expect(stripStringSuffix("", "")).toEqual("")
  })
})

describe("routeConcat", () => {
  it("joins two segments without slashes", () => {
    expect(routeConcat("users", "posts")).toEqual("users/posts")
  })

  it("joins segments with a trailing slash on A and a leading slash on B", () => {
    expect(routeConcat("users/", "/posts")).toEqual("users/posts")
  })

  it("joins two empty segments", () => {
    expect(routeConcat("", "")).toEqual("/")
  })
})
