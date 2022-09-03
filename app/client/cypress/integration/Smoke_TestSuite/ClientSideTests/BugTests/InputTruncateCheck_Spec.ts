import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  fakerHelper = ObjectsRegistry.FakerHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  apiPage = ObjectsRegistry.ApiPage,
  locator = ObjectsRegistry.CommonLocators;

const widgetsToTest = {
  [WIDGET.INPUT_V2]: {
    testCases: [
      { input: "test", charToClear: 0 },
      { input: "12", charToClear: 0 },
      { input: "hello", charToClear: 6 },
      { input: "hel", charToClear: 0 },
      {
        input: "12",
        charToClear: 4,
      },
      {
        input: "456",
        charToClear: 2,
      },
      {
        input: fakerHelper.GetRandomText(),
        charToClear: -1,
      },
    ],
    widgetName: "Input widget",
    widgetPrefixName: "Input",
  },
  [WIDGET.PHONE_INPUT]: {
    testCases: [
      {
        input: "9999999999",
        charToClear: 0,
      },
      {
        input: "12",
        charToClear: 4,
      },
      {
        input: "456",
        charToClear: 2,
      },
      {
        input: fakerHelper.GetUSPhoneNumber(),
        charToClear: -1,
      },
    ],
    widgetName: "Phone Input widget",
    widgetPrefixName: "PhoneInput",
  },
  [WIDGET.CURRENCY_INPUT]: {
    testCases: [
      { input: "1233", charToClear: 0 },
      {
        input: "12",
        charToClear: 5,
      },
      {
        input: "456",
        charToClear: 2,
      },
      {
        input: fakerHelper.GetRandomNumber(),
        charToClear: -1,
      },
    ],
    widgetName: "Currency Input widget",
    widgetPrefixName: "CurrencyInput",
  },
};

function configureApi() {
  apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users", "FirstAPI");
  apiPage.EnterHeader("value", "{{this.params.value}}");
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig], index) => {
  describe(`${testConfig.widgetName} widget test for storeValue save, Api Call params`, () => {
    it(`1. DragDrop widget & Label/Text widgets`, () => {
      if (index === 0) {
        configureApi();
      }
      ee.PinUnpinEntityExplorer(false);
      ee.DragDropWidgetNVerify(widgetSelector, 100, 200);
      ee.DragDropWidgetNVerify(WIDGET.BUTTON, 400, 200);
      //ee.SelectEntityByName(WIDGET.BUTTONNAME("1"));
      // Set onClick action, storing value
      propPane.EnterJSContext(
        PROPERTY_SELECTOR.onClickFieldName,
        `{{storeValue('textPayloadOnSubmit',${testConfig.widgetPrefixName}1.text); FirstAPI.run({ value: ${testConfig.widgetPrefixName}1.text })}}`,
      );

      ee.DragDropWidgetNVerify(WIDGET.TEXT, 300, 300);
      //ee.SelectEntityByName(WIDGET.TEXTNAME("1"));
      // Display the bound store value
      propPane.UpdatePropertyFieldValue(
        PROPERTY_SELECTOR.TextFieldName,
        `{{appsmith.store.textPayloadOnSubmit}}`,
      );
      ee.PinUnpinEntityExplorer(true);
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

      const inputs = testConfig.testCases;
      agHelper.ClearInputText("Label");

      inputs.forEach(({ charToClear, input }) => {
        // Input text and hit enter key
        // if (charToClear > 0) {
        //   cy.get(getWidgetInputSelector(widgetSelector))
        //     .clear()
        //     .type(`${input}`);
        // } else {
        //   cy.get(getWidgetInputSelector(widgetSelector)).type(`${input}`);
        // }

        agHelper.RemoveCharsNType(
          locator._widgetInputSelector(widgetSelector),
          charToClear,
          input,
        );
        agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));

        agHelper
          .GetText(locator._widgetInputSelector(widgetSelector), "val")
          .then(($expected: any) => {
            // Assert if the Currency widget has random number with trailing zero, then
            // if (widgetSelector === WIDGET.CURRENCY_INPUT) {
            //   cy.get(getWidgetSelector(WIDGET.TEXT)).should(
            //     "have.text",
            //     expected == null
            //       ? input
            //           .replace(/^0+/, "") //to remove initial 0
            //           .replace(/.{3}/g, "$&,")//to add comma after every 3 chars
            //           .replace(/(^,)|(,$)/g, "")//to remove start & end comma's if any
            //       : expected,
            //   );

            agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
              expect($label).to.eq($expected);
            });

            cy.wait("@postExecute").then((interception: any) => {
              expect(
                interception.response.body.data.request.headers.value,
              ).to.deep.equal([$expected]);
            });
            //}
          });
      });
    });

    it("3. Delete all the widgets on canvas", () => {
      agHelper.GetNClick(locator._widgetInputSelector(widgetSelector));
      agHelper.PressDelete();

      agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
      agHelper.AssertContains("is not defined"); //Since widget is removed & Button is still holding its reference
      agHelper.PressDelete();

      agHelper.GetNClick(getWidgetSelector(WIDGET.TEXT)).click();
      agHelper.GetNClick(propPane._deleteWidget);
    });
  });
});
