import assert from "node:assert/strict";
import { test } from "node:test";
import { validateMaterialFile, matchesFileSignature, MAX_MATERIAL_BYTES } from "../src/lib/validation/materials.ts";

test("allowed extensions and MIME types agree, including uppercase extensions", () => {
  for (const [name, type] of [["notes.PDF", "application/pdf"], ["notes.png", "image/png"], ["notes.jpg", "image/jpeg"], ["notes.jpeg", "image/jpeg"], ["notes.webp", "image/webp"]]) assert.equal(validateMaterialFile({ name, type, size: 100 }), null);
  for (const [name, type] of [["notes.pdf", "text/plain"], ["notes.exe", "application/pdf"], ["notes.png", "application/pdf"], ["../notes.pdf", "application/pdf"]]) assert.ok(validateMaterialFile({ name, type, size: 100 }));
});
test("empty and oversized files are rejected; 20 MB is accepted", () => {
  for (const size of [0, MAX_MATERIAL_BYTES + 1]) assert.ok(validateMaterialFile({ name: "notes.pdf", type: "application/pdf", size }));
  assert.equal(validateMaterialFile({ name: "notes.pdf", type: "application/pdf", size: MAX_MATERIAL_BYTES }), null);
});
test("server file signatures reject disguised content", async () => {
  assert.equal(await matchesFileSignature(new File(["%PDF-1.7"], "notes.pdf", { type: "application/pdf" })), true);
  assert.equal(await matchesFileSignature(new File(["not a PDF"], "notes.pdf", { type: "application/pdf" })), false);
  for (const [type, bytes] of [["image/png", [137,80,78,71,13,10,26,10]], ["image/jpeg", [255,216,255]], ["image/webp", [82,73,70,70,0,0,0,0,87,69,66,80]]]) {
    assert.equal(await matchesFileSignature(new File([new Uint8Array(bytes)], "fixture", { type })), true);
    assert.equal(await matchesFileSignature(new File(["wrong"], "fixture", { type })), false);
  }
});
