import { describe, expect, it } from "vitest";
import { validatePassword } from "./passwordRules";

describe("validatePassword", () => {
  it("accepts a password with letters and numbers", () => {
    expect(validatePassword("Password123")).toBe("");
  });

  it.each([
    ["short1", "at least 8 characters"],
    ["a1".repeat(65), "at most 128 characters"],
    ["onlyletters", "one letter and one number"],
    ["12345678", "one letter and one number"],
  ])("rejects %j", (password, message) => {
    expect(validatePassword(password)).toContain(message);
  });
});
