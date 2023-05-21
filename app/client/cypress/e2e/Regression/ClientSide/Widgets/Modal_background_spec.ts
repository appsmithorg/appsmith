import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { AggregateHelper, CommonLocators, DeployMode } = ObjectsRegistry;

describe("Modal Widget background color spec", () => {
  before(() => {
    cy.fixture("modalWidgetBGcolorDSL").then((val: any) => {
      AggregateHelper.AddDsl(val);
    });
  });

  it("1. Should have background color in edit mode and deploy mode", () => {
    cy.get(CommonLocators._widgetInCanvas("buttonwidget")).click();
    cy.get(CommonLocators._modalWrapper).should(
      "have.css",
      "background-color",
      "rgb(253, 224, 71)",
    );
    DeployMode.DeployApp();
    cy.get(CommonLocators._widgetInDeployed("buttonwidget")).click();
    cy.get(CommonLocators._modalWrapper).should(
      "have.css",
      "background-color",
      "rgb(253, 224, 71)",
    );
  });
});
