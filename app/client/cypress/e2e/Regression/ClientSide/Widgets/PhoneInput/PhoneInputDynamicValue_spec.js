import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetName = "phoneinputwidget";

describe(
  "Phone input widget - ",
  { tags: ["@tag.All", "@tag.PhoneInput", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("PhoneInputDynamic");
    });

    it("1. Should show empty dropdown for a typo", () => {
      EditorNavigation.SelectEntityByName("PhoneInput1", EntityType.Widget);
      // Turn on changecountrycode
      propPane.TogglePropertyState("Change country code");

      // Click on the country code change option
      cy.get(".t--input-country-code-change").first().click().wait(200);
      // Search with a typo
      cy.get(".t--search-input input").type("inpia");
      cy.wait(500);
      // Assert the options dropdown is still open
      cy.get(".t--search-input input").should("be.visible");

      deployMode.DeployApp();
      // Click on the country code change option
      cy.get(".t--input-country-code-change").first().click();
      // Search with a typo
      cy.get(".t--search-input input").type("inpia");
      cy.wait(500);
      // Assert the options dropdown is still open
      cy.get(".t--search-input input").should("be.visible");
      deployMode.NavigateBacktoEditor();
    });

    it("2. should check that widget can be used with dynamic default dial code", () => {
      cy.openPropertyPane(widgetName);
      cy.get(".t--property-control-defaultcountrycode .CodeMirror-code").should(
        "contain",
        "{{appsmith.store.test}}",
      );
      cy.get(".t--input-country-code-change").first().click();
      cy.get(".t--search-input input").type("india");
      cy.wait(500);
      cy.get(".t--dropdown-option").last().click();
      cy.get(".t--property-control-defaultcountrycode .CodeMirror-code").should(
        "contain",
        "{{appsmith.store.test}}",
      );
      deployMode.DeployApp();
      cy.get(".bp3-button.select-button").click({ force: true });
      cy.get(".menu-item-text").first().click({ force: true });
      cy.get(".t--input-country-code-change").should("contain", "+91");
      cy.get(".t--widget-textwidget").should("contain", "+91:IN:+91");
      cy.get(".bp3-button.select-button").click({ force: true });
      cy.get(".menu-item-text").last().click({ force: true });
      cy.get(".t--input-country-code-change").should("contain", "+93");
      cy.get(".t--widget-textwidget").should("contain", "+93:AF:+93");
    });
  },
);
