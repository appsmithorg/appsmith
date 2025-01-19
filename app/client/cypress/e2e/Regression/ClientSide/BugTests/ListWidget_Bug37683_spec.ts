import {
    agHelper,
    locators,
    propPane,
  } from "../../../../support/Objects/ObjectsCore";
 
  const widgetSelector = (name: string) => `[data-widgetname-cy="${name}"]`;
  const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;
 
  describe("Bug 37683: List widget auto-height update infinite loop error", () => {
    it("The list widget height should not trigger an auto-height update", () => {
      cy.dragAndDropToCanvas("listwidgetv2", {
        x: 300,
        y: 600,
      });
      propPane.EnterJSContext(
        "onitemclick",
        `{{List1.setVisibility(false)}}`,
        true,
        false,
      );
      cy.dragAndDropToCanvas("buttonwidget", {
        x: 600,
        y: 600,
      });
      propPane.EnterJSContext(
        "onClick",
        `{{List1.setVisibility(true)}}`,
        true,
        false,
      );
      agHelper.GetNClick(locators._enterPreviewMode);
      cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
        .eq(1)
        .click({ force: true });
      cy.wait(4000);
      agHelper.GetNClick(`${widgetSelector("Button1")}`);
      agHelper.AssertElementVisibility(locators._widgetInDeployed("list1"));
      agHelper.AssertElementVisibility(locators._widgetInDeployed("button1"));
      agHelper.GetNClick(locators._exitPreviewMode);
    });
  });