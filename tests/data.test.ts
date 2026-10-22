import test from "node:test";
import assert from "node:assert/strict";
import { money, rowsFromDocument } from "../src/lib/data.ts";
import { partialJSONParse } from "@copilotkit/shared";

test("streamed NDJSON renders only complete objects and preserves completed rows", () => {
  const header = '{"type":"heading","title":"A plan"}';
  const allocation = '{"type":"allocation","category":"Dining","amount":35000}';
  assert.deepEqual(rowsFromDocument(header + "\n" + allocation.slice(0, 30)), [
    { type: "heading", title: "A plan" },
  ]);
  assert.equal(rowsFromDocument(header + "\n" + allocation).length, 2);
  assert.deepEqual(rowsFromDocument('null\n42\n"text"\n{"type":123}\n{}'), []);
  assert.equal(money(150000), "$1,500");
  assert.equal(money(3799), "$37.99");
  assert.deepEqual(
    rowsFromDocument(
      '{"type":"heading","title":{"unexpected":"object"},"amount":-100}',
    ),
    [{ type: "heading" }],
  );
  // Parse the actual growing outer tool-argument string before reading NDJSON.
  const args = partialJSONParse(
    JSON.stringify({ document: header + "\n" + allocation }).slice(0, -15),
  );
  assert.equal(rowsFromDocument(args.document).length, 1);
});
