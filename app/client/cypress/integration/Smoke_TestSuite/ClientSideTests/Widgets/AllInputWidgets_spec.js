const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
  getWidgetInputSelector,
} from "../../../../locators/WidgetLocators";

const widgetsToTest = {
  [WIDGET.INPUT_V2]: {
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
  [WIDGET.PHONE_INPUT]: {
    testCases: [
      {
        input: "9999999999",
        expected: "(999) 999-9999",
        clearBeforeType: true,
      },
      {
        input: "{backspace}{backspace}{backspace}{backspace}12",
        expected: "(999) 999-12",
        clearBeforeType: false,
      },
      {
        input: "{backspace}{backspace}456",
        expected: "(999) 999-456",
        clearBeforeType: false,
      },
    ],
    widgetName: "Phone Input widget",
    widgetPrefixName: "PhoneInput",
  },
  [WIDGET.CURRENCY_INPUT]: {
    testCases: [
      { input: "1233", expected: "1,233", clearBeforeType: true },
      {
        input: "{backspace}{backspace}{backspace}{backspace}12",
        expected: "12",
        clearBeforeType: false,
      },
      {
        input: "{backspace}{backspace}456",
        expected: "456",
        clearBeforeType: false,
      },
    ],
    widgetName: "Currency Input widget",
    widgetPrefixName: "CurrencyInput",
  },
};

function configureApi() {
  cy.NavigateToAPI_Panel();
  cy.log("Navigation to API Panel screen successful");
  cy.CreateAPI("FirstAPI");
  cy.get(".CodeMirror-placeholder")
    .first()
    .should("have.text", "https://mock-api.appsmith.com/users");
  cy.log("Creation of FirstAPI Action successful");

  cy.EnterSourceDetailsWithbody(testdata.baseUrl, testdata.methods);

  cy.get(apiwidget.headerKey)
    .first()
    .click({ force: true })
    .type("value");
  cy.get(apiwidget.headerValue)
    .first()
    .click({ force: true })
    .type("{{this.params.value}}", { parseSpecialCharSequences: false });
  cy.WaitAutoSave();
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig], index) => {
  describe(`${testConfig.widgetName} widget test for storeValue save, Api Call params`, () => {
    it(`1. DragDrop widget & Label/Text widgets`, () => {
      if (index === 0) {
        configureApi();

        cy.get(explorer.addWidget).click();
      }
      cy.dragAndDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");

      cy.dragAndDropToCanvas(WIDGET.BUTTON, { x: 300, y: 400 });

      cy.dragAndDropToCanvas(WIDGET.TEXT, { x: 300, y: 600 });
    });

    it("2. StoreValue should have complete input value", () => {
      // if default input widget type is changed from text to any other type then uncomment below code.
      // if (widgetSelector === WIDGET.INPUT_V2) {
      //   cy.openPropertyPane(widgetSelector);
      //   cy.selectDropdownValue(".t--property-control-datatype", "Text");
      //   cy.get(".t--property-control-required label")
      //     .last()
      //     .click({ force: true });
      //   cy.closePropertyPane();
      // }

      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON);
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

        cy.get(getWidgetSelector(WIDGET.BUTTON)).click();

        // Assert if the Text widget contains the whole value, test
        cy.get(getWidgetSelector(WIDGET.TEXT)).should("have.text", expected);
      });
    });

    it("3. Api params getting correct input values", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON);
      // cy.get(PROPERTY_SELECTOR.onClick)
      //   .find(".t--js-toggle")
      //   .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{FirstAPI.run({ value: ${testConfig.widgetPrefixName}1.text })}}`,
      );

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

        cy.get(getWidgetSelector(WIDGET.BUTTON)).click();

        // Assert if the Api request contains the expected value

        cy.wait("@postExecute").then((interception) => {
          expect(
            interception.response.body.data.request.headers.value,
          ).to.deep.equal([expected]);
        });
      });
    });

    it("4. Delete all the widgets on canvas", () => {
      cy.get(getWidgetSelector(WIDGET.BUTTON)).click();
      cy.get("body").type(`{del}`, { force: true });

      cy.get(getWidgetSelector(WIDGET.TEXT)).click();
      cy.get("body").type(`{del}`, { force: true });

      cy.get(getWidgetSelector(widgetSelector)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });
});
