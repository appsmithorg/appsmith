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
    cy.addSuccessMessage("Submitted!!", ".t--property-control-onsubmit");
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

  it("4. Validate DataType - NUMBER can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Number");
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

  it("5. Validate DataType - PASSWORD can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Password");
    ["test", "test123", "123", "-", "", "$100.22", "test@appsmith.com"].forEach(
      (text) => {
        enterAndTest(text, text);
      },
    );
  });

  it("6. Validate DataType - EMAIL can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Email");
    ["test", "test123", "123", "-", "", "$100.22", "test@appsmith.com"].forEach(
      (text) => {
        enterAndTest(text, text);
      },
    );
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

  it("8. onSubmit should be triggered with the whole input value", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Text");
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });
    // Set onSubmit action, storing value
    cy.get(".t--property-control-onsubmit")
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      ".t--property-control-onsubmit",
      "{{storeValue('textPayloadOnSubmit',Input1.text)}}",
    );
    // Bind to stored value above
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      "{{appsmith.store.textPayloadOnSubmit}}",
    );
    cy.closePropertyPane();
    cy.get(widgetInput).clear();
    cy.wait(300);
    // Input text and hit enter key
    cy.get(widgetInput).type("test{enter}");
    // Assert if the Text widget contains the whole value, test
    cy.get(".t--widget-textwidget").should("have.text", "test");
  });

  function enterAndTest(text, expected) {
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    if (text) {
      cy.get(`.t--widget-${widgetName} input`)
        .click()
        .type(text); //.should('have.value', text);
    }
    cy.get(".t--widget-textwidget").should("contain", expected);
  }
});
