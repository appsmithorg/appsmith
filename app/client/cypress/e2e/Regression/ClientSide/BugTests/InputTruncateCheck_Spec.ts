import {
  PROPERTY_SELECTOR,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

const widgetsToTest = {
  [_.draggableWidgets.INPUT_V2]: {
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
        input: _.fakerHelper.GetRandomText(),
        charToClear: -1,
      },
    ],
    widgetName: "Input widget",
    widgetPrefixName: "Input",
  },
  [_.draggableWidgets.PHONE_INPUT]: {
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
        input: _.fakerHelper.GetUSPhoneNumber(),
        charToClear: -1,
      },
    ],
    widgetName: "Phone Input widget",
    widgetPrefixName: "PhoneInput",
  },
  [_.draggableWidgets.CURRENCY_INPUT]: {
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
        input: _.fakerHelper.GetRandomNumber(),
        charToClear: -1,
      },
    ],
    widgetName: "Currency Input widget",
    widgetPrefixName: "CurrencyInput",
  },
};

function configureApi() {
  cy.fixture("datasources").then((datasourceFormData) => {
    _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"], "FirstAPI");
  });
  _.apiPage.EnterHeader("value", "{{this.params.value}}");
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig], index) => {
  describe(`${testConfig.widgetName} widget test for storeValue save, Api Call params`, () => {
    it(`1. DragDrop widget & Label/Text widgets`, () => {
      if (index === 0) {
        configureApi();
      }
      _.entityExplorer.PinUnpinEntityExplorer(false);
      _.entityExplorer.DragDropWidgetNVerify(widgetSelector, 300, 200);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.BUTTON,
        600,
        200,
      );
      //_.entityExplorer.SelectEntityByName(_.draggableWidgets.BUTTONNAME("1"));
      // Set onClick action, storing value
      _.propPane.EnterJSContext(
        PROPERTY_SELECTOR.onClickFieldName,
        `{{storeValue('textPayloadOnSubmit',${testConfig.widgetPrefixName}1.text); FirstAPI.run({ value: ${testConfig.widgetPrefixName}1.text })}}`,
      );

      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 500, 300);
      //_.entityExplorer.SelectEntityByName(_.draggableWidgets.TEXTNAME("1"));
      // Display the bound store value
      _.propPane.UpdatePropertyFieldValue(
        PROPERTY_SELECTOR.TextFieldName,
        `{{appsmith.store.textPayloadOnSubmit}}`,
      );
      _.entityExplorer.PinUnpinEntityExplorer(true);
    });

    it("2. StoreValue should have complete input value", () => {
      // if default input widget type is changed from text to any other type then uncomment below code.
      // if (widgetSelector === _.draggableWidgets.INPUT_V2) {
      //   cy.openPropertyPane(widgetSelector);
      //   cy.selectDropdownValue(".t--property-control-datatype", "Text");
      //   cy.get(".t--property-control-required label")
      //     .last()
      //     .click({ force: true });
      //   cy.closePropertyPane();
      // }

      const inputs = testConfig.testCases;
      _.agHelper.ClearInputText("Label");

      inputs.forEach(({ charToClear, input }) => {
        // Input text and hit enter key
        // if (charToClear > 0) {
        //   cy.get(getWidgetInputSelector(widgetSelector))
        //     .clear()
        //     .type(`${input}`);
        // } else {
        //   cy.get(getWidgetInputSelector(widgetSelector)).type(`${input}`);
        // }

        _.agHelper.RemoveCharsNType(
          _.locators._widgetInputSelector(widgetSelector),
          charToClear,
          input,
        );
        _.agHelper.GetNClick(getWidgetSelector(_.draggableWidgets.BUTTON));

        _.agHelper
          .GetText(_.locators._widgetInputSelector(widgetSelector), "val")
          .then(($expected: any) => {
            // Assert if the Currency widget has random number with trailing zero, then
            // if (widgetSelector === _.draggableWidgets.CURRENCY_INPUT) {
            //   cy.get(getWidgetSelector(_.draggableWidgets.TEXT)).should(
            //     "have.text",
            //     expected == null
            //       ? input
            //           .replace(/^0+/, "") //to remove initial 0
            //           .replace(/.{3}/g, "$&,")//to add comma after every 3 chars
            //           .replace(/(^,)|(,$)/g, "")//to remove start & end comma's if any
            //       : expected,
            //   );

            _.agHelper
              .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
              .then(($label) => {
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
      _.agHelper.GetNClick(_.locators._widgetInputSelector(widgetSelector));
      _.agHelper.PressDelete();

      _.agHelper.GetNClick(getWidgetSelector(_.draggableWidgets.BUTTON));
      _.agHelper.AssertContains("is not defined"); //Since widget is removed & Button is still holding its reference
      _.agHelper.PressDelete();

      _.agHelper.GetNClick(getWidgetSelector(_.draggableWidgets.TEXT)).click();
      _.agHelper.GetNClick(_.propPane._deleteWidget);
    });
  });
});
