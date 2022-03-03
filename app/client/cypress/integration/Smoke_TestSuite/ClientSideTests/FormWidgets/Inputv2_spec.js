const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "inputwidgetv2";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Input widget V2 - ", () => {
  it("1. DragDrop Input & Label/Text widgets", () => {
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

  it("2. Validate input widget resets OnSubmit", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      ".t--property-control-onsubmit .t--open-dropdown-Select-Action",
    ).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Submitted!!");
    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("test{enter}"); //Clicking enter submits the form here
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  it("3. Validate DataType - TEXT can be entered into Input widget", () => {
    [
      "test:test:true",
      "test123:test123:true",
      "123:123:true",
      "::true",
      "$100.22:$100.22:true",
      "test@appsmith.com:test@appsmith.com:true",
    ].forEach((text) => enterAndTest(text.split(":")[0], text));

    cy.openPropertyPane(widgetName);

    //required: on
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
      "::false",
    ].forEach((text) => enterAndTest(text.split(":")[0], text));
  });

  it("4. Validate DataType - NUMBER can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Number");
    [
      "invalid:null:null:false",
      "invalid123:123:123:true",
      "123:123:123:true",
      "-:null:null:false",
      ":null:null:false",
      "$100.22:100.22:100.22:true",
      "invalid@appsmith.com:null:null:false",
      "1.001:1.001:1.001:true",
      "1.1.:null:null:false",
    ].forEach((text) => {
      const split = text.split(":");
      enterAndTest(split.shift(), split.join(":"));
    });

    //required: off
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    cy.selectDropdownValue(".t--property-control-datatype", "Number");
    [
      "invalid:null:null:true",
      "invalid123:123:123:true",
      "123:123:123:true",
      "-:null:null:false",
      ":null:null:true",
      "$100.22:100.22:100.22:true",
      "invalid@appsmith.com:null:null:false",
      "1.001:1.001:1.001:true",
      "1.1.:null:null:false",
    ].forEach((text) => {
      const split = text.split(":");
      enterAndTest(split.shift(), split.join(":"));
    });
  });

  it("5. Validate DataType - PASSWORD can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Password");
    [
      "test:test:true",
      "test123:test123:true",
      "123:123:true",
      "-:-:true",
      "::true",
      "$100.22:$100.22:true",
      "test@appsmith.com:test@appsmith.com:true",
    ].forEach((text) => enterAndTest(text.split(":")[0], text));

    //required: on
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

  it("6. Validate DataType - EMAIL can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Email");
    [
      "test:test:false",
      "test123:test123:false",
      "123:123:false",
      "-:-:false",
      "::false",
      "$100.22:$100.22:false",
      "test@appsmith.com:test@appsmith.com:true",
    ].forEach((text) => enterAndTest(text.split(":")[0], text));

    //required: off
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    [
      "test:test:false",
      "test123:test123:false",
      "123:123:false",
      "-:-:false",
      "::true",
      "$100.22:$100.22:false",
      "test@appsmith.com:test@appsmith.com:true",
    ].forEach((text) => enterAndTest(text.split(":")[0], text));
  });

  it("7. Validating other properties - Input validity with #valid", () => {
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

  function enterAndTest(text, expected) {
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    if (text) {
      cy.get(`.t--widget-${widgetName} input`)
        .click()
        .type(text);
    }
    cy.get(".t--widget-textwidget").should("contain", expected);
  }
});
