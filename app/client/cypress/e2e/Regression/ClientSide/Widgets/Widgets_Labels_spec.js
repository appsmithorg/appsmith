let COLUMN_SPACE = 0;

describe("Label feature", { tags: ["@tag.All", "@tag.Binding"] }, () => {
  before(() => {
    cy.get("#canvas-viewport").invoke("width", `640px`);
    // 72 - gutter width
    // 5 - scrollbar width
    // 12 - container padding
    // 64 - total number of columns
    COLUMN_SPACE = (640 - 12 - 5 - 72) / 64;
  });

  it("1. CheckboxGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "checkboxgroupwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='checkboxgroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("2. CurrencyInputWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "currencyinputwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("3. DatePickerWidget2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "datepickerwidget2",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='datepicker-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("4. InputWidgetV2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "inputwidgetv2",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("5. MultiSelectTreeWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "multiselecttreewidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='multitreeselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("6. MultiSelectWidgetV2 label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "multiselectwidgetv2",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='multiselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("7. PhoneInputWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "phoneinputwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='input-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("8. RadioGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "radiogroupwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='radiogroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("9. RichTextEditorWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "richtexteditorwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='rte-container']",
      isCompact: false,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("10. SelectWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "selectwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='select-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("11. SingleSelectTreeWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "singleselecttreewidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='treeselect-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });

  it("12. SwitchGroupWidget label properties: Text, Position, Alignment, Width", () => {
    const options = {
      widgetName: "switchgroupwidget",
      parentColumnSpace: COLUMN_SPACE,
      containerSelector: "[data-testid='switchgroup-container']",
      isCompact: true,
      labelText: "Name",
      labelWidth: 4,
    };

    cy.checkLabelForWidget(options);
  });
});
