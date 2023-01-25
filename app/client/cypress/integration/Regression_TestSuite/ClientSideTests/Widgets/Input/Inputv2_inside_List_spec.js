const dsl = require("../../../../../fixtures/InputWidgetV2InsideListDSL.json");

const widgetName = "inputwidgetv2";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Input widget V2 - ", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate input widget resets OnSubmit", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      ".t--property-control-onsubmit .t--open-dropdown-Select-Action",
    ).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Submitted!!");
    cy.get(widgetInput).clear({ force: true });
    cy.wait(300);
    cy.get(widgetInput).type("test{enter}"); //Clicking enter submits the form here
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  it("2. Validate DataType - TEXT can be entered into Input widget", () => {
    [
      {
        input: "test",
        expected: "test:true:false",
      },
      {
        input: "test123",
        expected: "test123:true:false",
      },
      {
        input: "123",
        expected: "123:true:false",
      },
      {
        input: "",
        expected: ":true:false",
      },
      {
        input: "$100.22",
        expected: "$100.22:true:false",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:true:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("3. Validate DataType - NUMBER can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Number");

    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    cy.selectDropdownValue(".t--property-control-datatype", "Number");
    [
      {
        input: "invalid",
        expected: "null:true:false",
      },
      {
        input: "invalid123",
        expected: "123:true:false",
      },
      {
        input: "123",
        expected: "123:true:false",
      },
      {
        input: "-",
        expected: "null:true:false",
      },
      {
        input: "",
        expected: "null:true:false",
      },
      {
        input: "$100.22",
        expected: "100.22:true:false",
      },
      {
        input: "invalid@appsmith.com",
        expected: "null:true:false",
      },
      {
        input: "1.001",
        expected: "1.001:true:false",
      },
      {
        input: "1.1.",
        expected: "null:true:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("4. Validate DataType - PASSWORD can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Password");
    [
      {
        input: "test",
        expected: "test:true:false",
      },
      {
        input: "test123",
        expected: "test123:true:false",
      },
      {
        input: "123",
        expected: "123:true:false",
      },
      {
        input: "-",
        expected: "-:true:false",
      },
      {
        input: "",
        expected: ":true:false",
      },
      {
        input: "$100.22",
        expected: "$100.22:true:false",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:true:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("5. Validate DataType - EMAIL can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Email");

    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    [
      {
        input: "test",
        expected: "test:true:false",
      },
      {
        input: "test123",
        expected: "test123:true:false",
      },
      {
        input: "123",
        expected: "123:true:false",
      },
      {
        input: "-",
        expected: "-:true:false",
      },
      {
        input: "",
        expected: ":true:false",
      },
      {
        input: "$100.22",
        expected: "$100.22:true:false",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:true:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  function enterAndTest(text, expected) {
    cy.get(`.t--widget-${widgetName} input`).clear({ force: true });
    cy.wait(300);
    if (text) {
      cy.get(`.t--widget-${widgetName} input`)
        .click()
        .type(text);
    }
    cy.get(".t--widget-textwidget").should("contain", expected);
  }
});
