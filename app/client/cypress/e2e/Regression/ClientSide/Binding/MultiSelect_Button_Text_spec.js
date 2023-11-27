/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const explorer = require("../../../../locators/explorerlocators.json");
import {
  agHelper,
  entityExplorer,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";

const widgetsToTest = {
  [WIDGET.MULTISELECT]: {
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
  },
};

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for validating reset action`, function () {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });
    before(() => {
      agHelper.AddDsl("defaultMetadataDsl");
    });

    it(`1. DragDrop Widget ${testConfig.widgetName}`, function () {
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");
    });

    it("2. Bind Button on click  and Text widget content", function () {
      EditorNavigation.SelectEntityByName("Button4", EntityType.Widget);
      cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("${testConfig.widgetPrefixName}",true).then(() => showAlert("success"))}}`,
      );
      // Bind to stored value above
      EditorNavigation.SelectEntityByName("Text3", EntityType.Widget);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testConfig.textBindingValue);
      cy.closePropertyPane();

      agHelper.GetNClick(".rc-select-selector", 0, true);
      cy.wait(1000);
      cy.get('.rc-select-item-option:contains("Blue")').click({ force: true });
      cy.wait(1000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("contain.text", "BLUE");
      });
      const inputs = testConfig.testCases;
      cy.get(getWidgetSelector(WIDGET.BUTTON))
        .scrollIntoView()
        .click({ force: true });
      cy.wait("@updateLayout");
      cy.get(".t--widget-buttonwidget:contains('Submit')")
        .scrollIntoView()
        .click({ force: true });
      cy.wait(4000);
    });

    it("3. Publish the app and validate reset action", function () {
      deployMode.DeployApp();
      cy.get(".rc-select-selection-overflow").click({ force: true });
      cy.get(".rc-select-item-option:contains('Blue')").click({ force: true });
      cy.wait(1000);
      cy.get("button:contains('Submit')").click({ force: true });
      cy.wait(1000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("not.contain.text", "BLUE");
      });
      cy.get("div.Toastify__toast").contains("success");
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
