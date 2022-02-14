const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "inputwidgetv2";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Input widget V2 - ", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Input1.text}}:{{Input1.value}}:{{Input1.isValid}}`,
    );
  });

  describe("TEXT type -", () => {
    it("should test text can be entered into widget", () => {
      function enterAndTest(text, expected) {
        cy.get(`.t--widget-${widgetName} input`).clear();
        cy.wait(300);
        if (text) {
          cy.get(`.t--widget-${widgetName} input`).type(text);
        }
        cy.get(".t--widget-textwidget").should("contain", expected);
      }

      [
        "test:test:true",
        "test123:test123:true",
        "123:123:true",
        "::true",
        "$100.22:$100.22:true",
        "test@appsmith.com:test@appsmith.com:true",
      ].forEach((text) => enterAndTest(text.split(":")[0], text));

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-required label")
        .last()
        .click({ force: true });

      [
        "test:test:true",
        "test123:test123:true",
        "123:123:true",
        "-:-:true",
        "::false",
        "$100.22:$100.22:true",
        "test@appsmith.com:test@appsmith.com:true",
      ].forEach((text) => enterAndTest(text.split(":")[0], text));
    });
  });

  describe("Number type -", () => {
    it("should test text can be entered into widge", () => {
      cy.openPropertyPane(widgetName);
      cy.selectDropdownValue(".t--property-control-datatype", "Number");
      function enterAndTest(text, expected) {
        cy.get(`.t--widget-${widgetName} input`).clear();
        cy.wait(300);
        if (text) {
          cy.get(`.t--widget-${widgetName} input`).type(text);
        }
        cy.get(".t--widget-textwidget").should("contain", expected);
      }

      [
        "test:",
        "test123:123",
        "123:123",
        "-:-",
        ":",
        "$100.22:100.22",
        "test@appsmith.com:",
      ].forEach((text) => {
        enterAndTest(text.split(":")[0], text.split(":")[1]);
      });
    });
  });

  describe("Password type -", () => {
    it("should test text can be entered into widget", () => {
      cy.openPropertyPane(widgetName);
      cy.selectDropdownValue(".t--property-control-datatype", "Password");
      function enterAndTest(text) {
        cy.get(`.t--widget-${widgetName} input`).clear();
        cy.wait(300);
        if (text) {
          cy.get(`.t--widget-${widgetName} input`).type(text);
        }
        cy.get(".t--widget-textwidget").should("contain", text);
      }

      [
        "test",
        "test123",
        "123",
        "-",
        "",
        "$100.22",
        "test@appsmith.com",
      ].forEach(enterAndTest);
    });
  });

  describe("Email type -", () => {
    it("should test text can be entered into widget", () => {
      cy.openPropertyPane(widgetName);
      cy.selectDropdownValue(".t--property-control-datatype", "Email");
      function enterAndTest(text) {
        cy.get(`.t--widget-${widgetName} input`).clear();
        cy.wait(300);
        if (text) {
          cy.get(`.t--widget-${widgetName} input`).type(text);
        }
        cy.get(".t--widget-textwidget").should("contain", text);
      }

      [
        "test",
        "test123",
        "123",
        "-",
        "",
        "$100.22",
        "test@appsmith.com",
      ].forEach(enterAndTest);
    });
  });

  it("should check that widget input resets on submit", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      ".t--property-control-onsubmit .t--open-dropdown-Select-Action",
    ).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Submitted!!");

    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("test{enter}");
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  describe("Should test other properties of the input widget - ", () => {
    it("#valid", () => {
      cy.openPropertyPane(widgetName);
      [
        ["{{1 === 2}}", "false"],
        ["", "true"],
        ["{{1 === 1}}", "true"],
        ["", "true"],
      ].forEach(([input, expected]) => {
        cy.updateCodeInput(".t--property-control-valid", input);
        cy.wait(500);
        cy.validateEvaluatedValue(expected);
      });
    });
  });
});
