const explorer = require("../../../../locators/explorerlocators.json");

describe("Label feature", () => {
  before(() => {
    cy.get(explorer.addWidget).click();
  });

  it("CheckboxGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "checkboxgroupwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='checkboxgroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("CurrencyInputWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "currencyinputwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("DatePickerWidget2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "datepickerwidget2",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='datepicker-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("InputWidgetV2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "inputwidgetv2",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("MultiSelectTreeWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "multiselecttreewidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='multitreeselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("MultiSelectWidgetV2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "multiselectwidgetv2",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='multiselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("PhoneInputWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "phoneinputwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("RadioGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "radiogroupwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='radiogroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("RichTextEditorWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "richtexteditorwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='rte-container']",
      isCompact: false,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("SelectWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "selectwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='select-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("SingleSelectTreeWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "singleselecttreewidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='treeselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("SwitchGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "switchgroupwidget",
      parentColumnSpace: 11.9375,
      containerSelector: "[data-testid='switchgroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });
});
