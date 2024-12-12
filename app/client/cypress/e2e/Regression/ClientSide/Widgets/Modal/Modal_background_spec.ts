import {
  agHelper,
  deployMode,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Modal Widget background color spec",
  { tags: ["@tag.Widget", "@tag.Modal", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("modalWidgetBGcolorDSL");
    });

    it("1. Should have background color in edit mode and deploy mode", () => {
      cy.get(locators._widgetInCanvas("buttonwidget")).click();
      cy.get(locators._modalWrapper).should(
        "have.css",
        "background-color",
        "rgb(253, 224, 71)",
      );
      deployMode.DeployApp();
      cy.get(locators._widgetInDeployed("buttonwidget")).click();
      cy.get(locators._modalWrapper).should(
        "have.css",
        "background-color",
        "rgb(253, 224, 71)",
      );
    });
  },
);
