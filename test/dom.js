import { html } from "../build/dom.js";

describe("dom", function () {
  describe("html", function () {
    const documentFragment = document.createDocumentFragment();
    documentFragment.appendChild(document.createElement("div"));

    it("creates elements properly", function () {
      assert.deepEqual(html("<div></div>"), documentFragment);
    });

    it("parses invalid html", function () {
      assert.doesNotThrow(() => html("<div>"), Error);
    });

    it("does not fail on non-string value", function () {
      assert.doesNotThrow(() => html(undefined), Error);
    });

    it("creates a document fragment", function () {
      assert.instanceOf(html("<div></div>"), DocumentFragment);
    });
  });
});
