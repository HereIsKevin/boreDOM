import { _testables } from "../build/dom.js";

const {
  isTextNode,
  isElementNode,
  isCommentNode,
  html,
  sanitizeNode,
  isIdenticalNode,
  isSameNode,
  isRelatedNode,
  findKeepNodes,
  patchAttributes,
  patchNode,
  render,
} = _testables;

const textNode = document.createTextNode("");
const elementNode = document.createElement("div");
const commentNode = document.createComment("");

const documentFragment = document.createDocumentFragment();
documentFragment.appendChild(document.createElement("div"));

describe("dom", function () {
  describe("isTextNode", function () {
    it("text node is ok", function () {
      assert.isOk(isTextNode(textNode));
    });

    it("element node is not ok", function () {
      assert.isNotOk(isTextNode(elementNode));
    });

    it("comment node is not ok", function () {
      assert.isNotOk(isTextNode(commentNode));
    });

    it("fails on a non-node value", function () {
      assert.throws(() => isTextNode(undefined), TypeError);
    });
  });

  describe("isElementNode", function () {
    it("text node is not ok", function () {
      assert.isNotOk(isElementNode(textNode));
    });

    it("element node is ok", function () {
      assert.isOk(isElementNode(elementNode));
    });

    it("comment node is not ok", function () {
      assert.isNotOk(isElementNode(commentNode));
    });

    it("fails on a non-node value", function () {
      assert.throws(() => isElementNode(undefined), TypeError);
    });
  });

  describe("isCommentNode", function () {
    it("text node not is not ok", function () {
      assert.isNotOk(isCommentNode(textNode));
    });

    it("element node is not ok", function () {
      assert.isNotOk(isCommentNode(elementNode));
    });

    it("comment node is ok", function () {
      assert.isOk(isCommentNode(commentNode));
    });

    it("fails on a non-node value", function () {
      assert.throws(() => isCommentNode(undefined), TypeError);
    });
  });

  describe("html", function () {
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
