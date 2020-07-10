import { component } from "../dist/esm/index.js";

const { Component, bound, element, html, property, state } = component;
const assert = chai.assert;

describe("component", function () {
  describe("Component", function () {
    class TestComponent extends Component {
      render() {
        return super.render();
      }
    }

    window.customElements.define("test-component-1", TestComponent);

    const testComponent = document.createElement(
      "test-component-1"
    ) as TestComponent;

    it("can be constructed with new", function () {
      assert.doesNotThrow(() => new TestComponent(), TypeError);
    });

    it("has a shadow root", function () {
      assert.instanceOf(testComponent.root, ShadowRoot);
    });

    it("does not have an implemented render", function () {
      assert.throws(testComponent.render, Error);
    });
  });

  describe("bound", function () {
    class TestComponent extends Component {
      value: string;

      constructor() {
        super();

        this.value = "value";
      }

      @bound
      retrieveValue() {
        return this.value;
      }
    }

    window.customElements.define("test-component-2", TestComponent);

    it("binds to this properly", function () {
      const testComponent = new TestComponent();
      const retrieve = testComponent.retrieveValue;

      assert.equal(retrieve(), "value");
    });

    it("caches method after initial call", function () {
      const testComponent = new TestComponent();
      const retrieveFirst = testComponent.retrieveValue;
      const retrieveSecond = testComponent.retrieveValue;

      assert.equal(retrieveFirst, retrieveSecond);
    });

    it("destroys cache after update", function () {
      const testComponent = new TestComponent();
      const retrieveFirst = testComponent.retrieveValue;

      testComponent.retrieveValue = function () {
        return this.value;
      };

      const retrieveSecond = testComponent.retrieveValue;

      assert.notEqual(retrieveFirst, retrieveSecond);
    });
  });

  describe("element", function () {
    @element("test-component-3")
    class TestComponent extends Component {}

    it("creates a new custom element", function () {
      assert.doesNotThrow(() => new TestComponent(), TypeError);
    });

    it("defines the new element with the original name", function () {
      assert.instanceOf(
        document.createElement("test-component-3"),
        TestComponent
      );
    });
  });

  describe("html", function () {
    it("binds event handlers", function () {
      let value = 0;
      const result = html`<div onclick=${() => (value = 10)}></div>`;
      (result.children[0] as HTMLDivElement).click();

      assert.equal(value, 10);
    });
  });

  describe("property", function () {
    class TestComponent extends Component {
      @property numberValue = 10;
      @property stringValue = "value";
      @property booleanValue = true;

      render() {
        return new DocumentFragment();
      }
    }

    window.customElements.define("test-component-4", TestComponent);

    it("fails on non-primitives", function () {
      const testComponent = new TestComponent();

      assert.throw(
        () => ((testComponent.numberValue as unknown) = []),
        TypeError
      );
    });

    it("updates string attribute accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.stringValue = "blah";

      assert.equal(
        testComponent.stringValue,
        testComponent.getAttribute("string-value")
      );
    });

    it("updates string property accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.setAttribute("string-value", "blah");

      assert.equal(
        testComponent.stringValue,
        testComponent.getAttribute("string-value")
      );
    });

    it("converts to number properly", function () {
      const testComponent = new TestComponent();
      testComponent.numberValue = 100;

      assert.isNumber(testComponent.numberValue);
    });

    it("updates number attribute accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.numberValue = 100;

      assert.equal(
        testComponent.numberValue,
        Number(testComponent.getAttribute("number-value"))
      );
    });

    it("updates number property accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.setAttribute("number-value", String(100));

      assert.equal(
        testComponent.numberValue,
        Number(testComponent.getAttribute("number-value"))
      );
    });

    it("converts to boolean properly", function () {
      const testComponent = new TestComponent();
      testComponent.booleanValue = false;

      assert.isBoolean(testComponent.booleanValue);
    });

    it("updates boolean attribute accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.booleanValue = false;

      assert.equal(
        testComponent.booleanValue,
        Boolean(testComponent.getAttribute("boolean-value"))
      );
    });

    it("updates boolean property accordingly", function () {
      const testComponent = new TestComponent();
      testComponent.setAttribute("boolean-value", String(false));

      assert.equal(
        testComponent.booleanValue,
        !["0", "null", "undefined", "false", "NaN", ""].includes(
          testComponent.getAttribute("boolean-value") || ""
        )
      );
    });
  });

  describe("state", function () {
    let updated = false;

    class TestComponent extends Component {
      @state thing = { value: ["exist"] };

      update() {
        super.update();
        updated = true;
      }

      render() {
        return new DocumentFragment();
      }
    }

    window.customElements.define("test-component-5", TestComponent);

    const testComponent = new TestComponent();

    it("reacts on change", function () {
      testComponent.thing.value.push("blah");

      assert.ok(updated);
    });
  });
});
