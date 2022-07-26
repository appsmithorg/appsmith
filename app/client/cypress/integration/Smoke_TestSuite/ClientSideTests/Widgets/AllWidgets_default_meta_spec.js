const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/defaultMetaDsl.json");

import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
  getWidgetInputSelector,
} from "../../../../locators/WidgetLocators";

const widgetsToTest = {
  [WIDGET.MULTISELECT_WIDGET]: {
    testCases: [
      {
        input:
          '{{resetWidget("MultiSelect1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "MultiSelect1",
    widgetPrefixName: "MultiSelect1",
    textBindingValue: "{{MultiSelect1.selectedOptionValues}}",
    action: () => {
      cy.chooseColMultiSelectAndReset();
    },
  },
  [WIDGET.TAB]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Tabs1",
    widgetPrefixName: "Tabs1",
    textBindingValue: testdata.tabBindingValue,
    action: () => {
      cy.selectTabAndReset();
    },
  },
  [WIDGET.TABLE]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Table1",
    widgetPrefixName: "Table1",
    textBindingValue: testdata.tableBindingValue,
    action: () => {
      cy.selectTableAndReset();
    },
  },
};

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for validating reset action`, () => {
    before(() => {
      cy.addDsl(dsl);
    });

    it(`1. DragDrop Widget ${testConfig.widgetName}`, () => {
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");
    });

    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("${testConfig.widgetPrefixName}",true).then(() => showAlert("success"))}}`,
      );
      // Bind to stored value above
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testConfig.textBindingValue);
    });

    it("3. Publish the app and check the reset action", () => {
      // Set onClick action, storing value
      cy.PublishtheApp();
      testConfig.action();
      cy.get(".t--toast-action span").contains("success");
    });

    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(widgetSelector)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });
});
