import assert from "node:assert/strict";
import { test } from "node:test";
import { subjectSchema, subjectIdSchema } from "../src/lib/validation/subjects.ts";

test("subject validation trims fields and normalizes optional blanks", () => {
  assert.deepEqual(subjectSchema.parse({ name: " Calculus ", description: " ", instructor: " Dr. Smith " }), { name: "Calculus", description: null, instructor: "Dr. Smith" });
});
test("subject validation rejects invalid and oversized inputs", () => {
  const valid = { name: "Math", description: "", instructor: "" };
  for (const patch of [{ name: " " }, { name: null }, { name: "a".repeat(201) }, { instructor: "a".repeat(201) }, { description: "a".repeat(5001) }]) {
    assert.equal(subjectSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(subjectIdSchema.safeParse("not-an-id").success, false);
});
