import {
  PROPERTY_SELECTOR,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  apiPage,
  draggableWidgets,
  fakerHelper,
  dataManager,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

const widgetsToTest = {
  [draggableWidgets.INPUT_V2]: {
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
  [draggableWidgets.PHONE_INPUT]: {
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
  [draggableWidgets.CURRENCY_INPUT]: {
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
  apiPage.CreateAndFillApi(
    dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    "FirstAPI",
  );
  apiPage.EnterHeader("value", "{{this.params.value}}");
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig], index) => {
  describe(
    `${testConfig.widgetName} widget test for storeValue save, Api Call params`,
    { tags: ["@tag.All", "@tag.Binding"] },
    () => {
      it(`1. DragDrop widget & Label/Text widgets`, () => {
        if (index === 0) {
          configureApi();
        }
        entityExplorer.DragDropWidgetNVerify(widgetSelector, 300, 200);
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 400, 400);
        //entityExplorer.SelectEntityByName(draggableWidgets.BUTTONNAME("1"));
        // Set onClick action, storing value
        propPane.EnterJSContext(
          PROPERTY_SELECTOR.onClickFieldName,
          `{{storeValue('textPayloadOnSubmit',${testConfig.widgetPrefixName}1.text); FirstAPI.run({ value: ${testConfig.widgetPrefixName}1.text })}}`,
        );

        entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 300);
        //entityExplorer.SelectEntityByName(draggableWidgets.TEXTNAME("1"));
        // Display the bound store value
        propPane.UpdatePropertyFieldValue(
          PROPERTY_SELECTOR.TextFieldName,
          `{{appsmith.store.textPayloadOnSubmit}}`,
        );
      });

      it("2. StoreValue should have complete input value", () => {
        // if default input widget type is changed from text to any other type then uncomment below code.
        // if (widgetSelector === draggableWidgets.INPUT_V2) {
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
            locators._widgetInputSelector(widgetSelector),
            charToClear,
            input,
          );
          agHelper.GetNClick(getWidgetSelector(draggableWidgets.BUTTON));

          agHelper
            .GetText(locators._widgetInputSelector(widgetSelector), "val")
            .then(($expected: any) => {
              // Assert if the Currency widget has random number with trailing zero, then
              // if (widgetSelector === draggableWidgets.CURRENCY_INPUT) {
              //   cy.get(getWidgetSelector(draggableWidgets.TEXT)).should(
              //     "have.text",
              //     expected == null
              //       ? input
              //           .replace(/^0+/, "") //to remove initial 0
              //           .replace(/.{3}/g, "$&,")//to add comma after every 3 chars
              //           .replace(/(^,)|(,$)/g, "")//to remove start & end comma's if any
              //       : expected,
              //   );
              agHelper.Sleep(500); //Adding time for CI flakyness in reading Label value
              agHelper
                .GetText(getWidgetSelector(draggableWidgets.TEXT))
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
        agHelper.GetNClick(locators._widgetInputSelector(widgetSelector));
        agHelper.PressDelete();

        //Since widget is removed & Button is still holding its reference
        debuggerHelper.AssertDebugError(
          `'${testConfig.widgetPrefixName}1' is not defined.`,
          "",
          true,
          false,
        );
        debuggerHelper.CloseBottomBar();
        agHelper.GetNClick(getWidgetSelector(draggableWidgets.BUTTON));
        agHelper.ValidateToastMessage(
          `${testConfig.widgetPrefixName}1 is not defined`,
        );
        agHelper.PressDelete();

        agHelper.GetNClick(getWidgetSelector(draggableWidgets.TEXT)).click();
        agHelper.GetNClick(propPane._deleteWidget);
      });
    },
  );
});
