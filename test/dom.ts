import { dom } from "../dist/esm/index.js";

const { html, render } = dom;
const assert = chai.assert;

describe("dom", function () {
  describe("html", function () {
    const template = document.createElement("template");
    template.innerHTML = "<div></div>";

    it("creates elements properly", function () {
      assert.deepEqual(html("<div></div>"), template.content);
    });

    it("parses invalid html", function () {
      assert.doesNotThrow(() => html("<div>"), Error);
    });

    it("does not fail on non-string value", function () {
      assert.doesNotThrow(() => html((undefined as unknown) as string), Error);
    });

    it("creates a document fragment", function () {
      assert.instanceOf(html("<div></div>"), DocumentFragment);
    });
  });

  describe("render", function () {
    it("updates to empty nodes properly", function () {
      const documentFragment = html("");
      render(documentFragment, html("<div></div>"));

      assert.deepEqual(documentFragment, html("<div></div>"));
    });

    it("updates from empty nodes properly", function () {
      const documentFragment = html("<div></div>");
      render(documentFragment, html(""));

      assert.deepEqual(documentFragment, html(""));
    });

    it("updates different nodes properly", function () {
      const documentFragment = html(
        '<div><div id="empty"></div></div><div class="blah">Some Content</div>'
      );
      render(documentFragment, html('<div id="stuff">Things</div>'));

      assert.deepEqual(documentFragment, html('<div id="stuff">Things</div>'));
    });

    it("moves nodes instead of copying", function () {
      const documentFragment = html("<div><div></div></div>");
      const updated = html("<div></div><div></div>");
      render(documentFragment, updated);

      assert.deepEqual(updated, html("<div></div>"));
    });
  });
});
