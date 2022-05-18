const explorer = require("../../../../locators/explorerlocators.json");

const WIDGET = {
  INPUT_WIDGET_V2: "inputwidgetv2",
  TEXT: "textwidget",
  PHONE_INPUT_WIDGET: "phoneinputwidget",
  CURRENCY_INPUT_WIDGET: "currencyinputwidget",
  BUTTON_WIDGET: "buttonwidget",
};

const PROPERTY_SELECTOR = {
  onClick: ".t--property-control-onclick",
  onSubmit: ".t--property-control-onsubmit",
  text: ".t--property-control-text",
};

const widgetsToTest = {
  [WIDGET.INPUT_WIDGET_V2]: {
    testCases: [
      { input: "test", expected: "test", clearBeforeType: true },
      { input: "12", expected: "test12", clearBeforeType: false },
      { input: "hello", expected: "hello", clearBeforeType: true },
      { input: "hel", expected: "hellohel", clearBeforeType: false },
      {
        input: "{backspace}{backspace}{backspace}{backspace}12",
        expected: "hell12",
        clearBeforeType: false,
      },
      {
        input: "{backspace}{backspace}456",
        expected: "hell456",
        clearBeforeType: false,
      },
    ],
    widgetName: "Input widget",
    widgetPrefixName: "Input",
  },
  // [WIDGET.PHONE_INPUT_WIDGET]: {
  //   testCases: [
  //     {
  //       input: "9999999999",
  //       expected: "(999) 999-9999:US:+1",
  //       clearBeforeType: true,
  //     },
  //     {
  //       input: "{backspace}{backspace}{backspace}{backspace}12",
  //       expected: "99999912:US:+1",
  //       clearBeforeType: false,
  //     },
  //     {
  //       input: "{backspace}{backspace}456",
  //       expected: "999999456:US:+1",
  //       clearBeforeType: false,
  //     },
  //   ],
  //   widgetName: "Phone Input widget",
  //   widgetPrefixName: "PhoneInput",
  // },
  // [WIDGET.CURRENCY_INPUT_WIDGET]: {
  //   testCases: [
  //     { input: "1233", expected: "1123", clearBeforeType: true },
  //     {
  //       input: "{backspace}{backspace}{backspace}{backspace}12",
  //       expected: "12",
  //       clearBeforeType: false,
  //     },
  //     {
  //       input: "{backspace}{backspace}456",
  //       expected: "456",
  //       clearBeforeType: false,
  //     },
  //   ],
  //   widgetName: "Currency Input widget",
  //   widgetPrefixName: "CurrencyInput",
  // },
};

const getWidgetSelector = (widget) => `.t--widget-${widget}`;
const getWidgetInputSelector = (widget) => `.t--widget-${widget} input`;

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for storeValue save, Api Call params`, () => {
    // const widgetSelector = WIDGET.INPUT_WIDGET_V2;
    // const testConfig = widgetsToTest[widgetSelector];

    it(`1. DragDrop Input widget & Label/Text widgets`, () => {
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");

      cy.dragAndDropToCanvas(WIDGET.BUTTON_WIDGET, { x: 300, y: 400 });

      cy.dragAndDropToCanvas(WIDGET.TEXT, { x: 300, y: 600 });
    });

    it("2. onSubmit should be triggered with the whole input value", () => {
      cy.openPropertyPane(widgetSelector);
      cy.selectDropdownValue(".t--property-control-datatype", "Text");
      cy.get(".t--property-control-required label")
        .last()
        .click({ force: true });

      cy.closePropertyPane();
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{storeValue('textPayloadOnSubmit',${testConfig.widgetPrefixName}1.text)}}`,
      );
      // Bind to stored value above
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(
        PROPERTY_SELECTOR.text,
        "{{appsmith.store.textPayloadOnSubmit}}",
      );
      cy.closePropertyPane();
      cy.get(getWidgetInputSelector(widgetSelector)).clear();
      cy.wait(300);

      const inputs = testConfig.testCases;

      inputs.forEach(({ clearBeforeType, expected, input }) => {
        // Input text and hit enter key
        if (clearBeforeType) {
          cy.get(getWidgetInputSelector(widgetSelector))
            .clear()
            .type(`${input}`);
        } else {
          cy.get(getWidgetInputSelector(widgetSelector)).type(`${input}`);
        }

        cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();

        // Assert if the Text widget contains the whole value, test
        cy.get(getWidgetSelector(WIDGET.TEXT)).should("have.text", expected);
      });
    });

    // after(() => {
    //   cy.deleteWidget(widgetSelector);
    //   cy.deleteWidget(WIDGET.BUTTON_WIDGET);
    //   cy.deleteWidget(WIDGET.TEXT);
    // });
  });
});
