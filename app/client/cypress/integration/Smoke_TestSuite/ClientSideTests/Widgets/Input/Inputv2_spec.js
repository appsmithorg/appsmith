const explorer = require("../../../../../locators/explorerlocators.json");

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

    cy.selectDropdownValue(".t--property-control-datatype", "Number");

    cy.get(widgetInput).clear();
    cy.get(widgetInput).type("1.0010{enter}"); //Clicking enter submits the form here
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  it("3. Validate DataType - TEXT can be entered into Input widget", () => {
    cy.selectDropdownValue(".t--property-control-datatype", "Text");
    [
      {
        input: "test",
        expected: "test:test:true",
      },
      {
        input: "test123",
        expected: "test123:test123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "",
        expected: "::true",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:true",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));

    cy.openPropertyPane(widgetName);

    //required: on
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    [
      {
        input: "test",
        expected: "test:test:true",
      },
      {
        input: "test123",
        expected: "test123:test123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "-",
        expected: "-:-:true",
      },
      {
        input: "",
        expected: "::false",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:true",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
      {
        input: "",
        expected: "::false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("4. Validate DataType - NUMBER can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Number");
    [
      {
        input: "invalid",
        expected: "null:null:false",
      },
      {
        input: "invalid123",
        expected: "123:123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "-",
        expected: "null:null:false",
      },
      {
        input: "",
        expected: "null:null:false",
      },
      {
        input: "$100.22",
        expected: "100.22:100.22:true",
      },
      {
        input: "invalid@appsmith.com",
        expected: "null:null:false",
      },
      {
        input: "1.001",
        expected: "1.001:1.001:true",
      },
      {
        input: "1.1.",
        expected: "null:null:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));

    //required: off
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    cy.selectDropdownValue(".t--property-control-datatype", "Number");
    [
      {
        input: "invalid",
        expected: "null:null:true",
      },
      {
        input: "invalid123",
        expected: "123:123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "-",
        expected: "null:null:false",
      },
      {
        input: "",
        expected: "null:null:true",
      },
      {
        input: "$100.22",
        expected: "100.22:100.22:true",
      },
      {
        input: "invalid@appsmith.com",
        expected: "null:null:false",
      },
      {
        input: "1.001",
        expected: "1.001:1.001:true",
      },
      {
        input: "1.1.",
        expected: "null:null:false",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("5. Validate DataType - PASSWORD can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Password");
    [
      {
        input: "test",
        expected: "test:test:true",
      },
      {
        input: "test123",
        expected: "test123:test123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "-",
        expected: "-:-:true",
      },
      {
        input: "",
        expected: "::true",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:true",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));

    //required: on
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    [
      {
        input: "test",
        expected: "test:test:true",
      },
      {
        input: "test123",
        expected: "test123:test123:true",
      },
      {
        input: "123",
        expected: "123:123:true",
      },
      {
        input: "-",
        expected: "-:-:true",
      },
      {
        input: "",
        expected: "::false",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:true",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
  });

  it("6. Validate DataType - EMAIL can be entered into Input widget", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Email");
    [
      {
        input: "test",
        expected: "test:test:false",
      },
      {
        input: "test123",
        expected: "test123:test123:false",
      },
      {
        input: "123",
        expected: "123:123:false",
      },
      {
        input: "-",
        expected: "-:-:false",
      },
      {
        input: "",
        expected: "::false",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:false",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));

    //required: off
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });

    [
      {
        input: "test",
        expected: "test:test:false",
      },
      {
        input: "test123",
        expected: "test123:test123:false",
      },
      {
        input: "123",
        expected: "123:123:false",
      },
      {
        input: "-",
        expected: "-:-:false",
      },
      {
        input: "",
        expected: "::true",
      },
      {
        input: "$100.22",
        expected: "$100.22:$100.22:false",
      },
      {
        input: "test@appsmith.com",
        expected: "test@appsmith.com:test@appsmith.com:true",
      },
    ].forEach(({ expected, input }) => enterAndTest(input, expected));
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
    cy.assertPageSave();

    cy.closePropertyPane();
    cy.get(widgetInput).clear();
    cy.wait(300);
    // Input text and hit enter key
    cy.get(widgetInput).type("test{enter}");
    // Assert if the Text widget contains the whole value, test
    cy.get(".t--widget-textwidget").should("have.text", "test");
  });

  it("9. changing default text should change text", () => {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Input1.text}}:{{Input1.value}}:{{Input1.isValid}}`,
    );
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(".t--property-control-defaulttext", `test`);
    // wait for evaluations
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).should("contain.value", "test");
    cy.get(".t--widget-textwidget").should("contain", "test:test:true");

    cy.updateCodeInput(".t--property-control-defaulttext", `anotherText`);
    // wait for evaluations
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).should(
      "contain.value",
      "anotherText",
    );
    cy.get(".t--widget-textwidget").should(
      "contain",
      "anotherText:anotherText:true",
    );

    cy.selectDropdownValue(".t--property-control-datatype", "Number");

    cy.updateCodeInput(".t--property-control-defaulttext", `{{1}}`);
    // wait for evaluations
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).should("contain.value", "1");
    cy.get(".t--widget-textwidget").should("contain", "1:1:true");

    cy.updateCodeInput(".t--property-control-defaulttext", `{{1.00010000}}`);
    // wait for evaluations
    cy.wait(300);
    cy.get(`.t--widget-${widgetName} input`).should("contain.value", "1.0001");
    cy.get(".t--widget-textwidget").should("contain", "1.0001:1.0001:true");
  });

  it("Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Input1.isDirty}}`);
    // Init isDirty
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-datatype", "Text");
    cy.updateCodeInput(".t--property-control-defaulttext", "a");
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("b");
    cy.wait(300);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultText
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(".t--property-control-defaulttext", "c");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });

  function enterAndTest(text, expected) {
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    if (text) {
      cy.get(`.t--widget-${widgetName} input`)
        .click({ force: true })
        .type(text);
    }
    cy.get(".t--widget-textwidget").should("contain", expected);
  }
});
