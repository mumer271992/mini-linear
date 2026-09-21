import { describe, expect, it } from "vitest";
import { parseTaskFilterParam } from "./task";

describe("parseTaskFilterParam", () => {
  it("returns an empty array when the param is absent", () => {
    expect(parseTaskFilterParam(undefined)).toEqual([]);
  });

  it("splits a comma-separated string", () => {
    expect(parseTaskFilterParam("BACKLOG,TODO")).toEqual(["BACKLOG", "TODO"]);
  });

  it("returns a single value as a one-element array", () => {
    expect(parseTaskFilterParam("BACKLOG")).toEqual(["BACKLOG"]);
  });

  it("joins a repeated-param string array before splitting", () => {
    expect(parseTaskFilterParam(["BACKLOG", "TODO,DONE"])).toEqual(["BACKLOG", "TODO", "DONE"]);
  });

  it("drops empty segments from stray commas", () => {
    expect(parseTaskFilterParam("BACKLOG,,TODO")).toEqual(["BACKLOG", "TODO"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseTaskFilterParam("")).toEqual([]);
  });
});
