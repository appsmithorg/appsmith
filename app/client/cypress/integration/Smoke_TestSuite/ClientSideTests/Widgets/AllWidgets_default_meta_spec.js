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
    WIDGET_TYPE : { 
      action: () => { cy.toggleJsAndUpdate() }
   },
  },
  [WIDGET.TREESELECT_WIDGET]: {
    testCases: [
      {
        input:
          '{{resetWidget("TreeSelect1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "TreeSelect1",
    widgetPrefixName: "TreeSelect1",
    textBindingValue: "{{TreeSelect1.selectedOptionValue}}",
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
      /*
      cy.closePropertyPane();


      const inputs = testConfig.testCases;
      cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
      cy.wait("@updateLayout");
      cy.get(".t--toast-action span").contains("success");
      */
    });
  });
});
