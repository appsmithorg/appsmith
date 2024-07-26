import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";
import {
  agHelper,
  anvilLayout,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST, modifierKey } from "../../../../support/Constants";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Paste functionality`,
  { tags: ["@tag.Anvil"] },
  () => {
    it("1. Checks if the non-modal widget is pasted into the mai canvas, zone and section", () => {
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      // when we select a widget, the URL is updated with widget ID, storing the URL to assert later
      cy.url().as("widgetSelectURLBeforeCopy");
      cy.get("body").type(`{${modifierKey}}c`);

      // paste into canvas
      agHelper.GetNClick(anvilLocators.mainCanvasSelector);
      cy.get("body").type(`{${modifierKey}}v`);
      // since we pasted in canvas, a new zone and section, and a new copied button should be created
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        2,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        2,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON),
        2,
      );

      // after the pasting, the new Widget is selected and the URL is updated with the new widget ID
      // so the URL should be different from the URL before copy
      cy.get("@widgetSelectURLBeforeCopy").should("not.eq", cy.url());

      // paste into section
      agHelper.GetNClick(
        anvilLocators.anvilWidgetNameSelectorFromEntityExplorer("Section1"),
      );
      cy.get("body").type(`{${modifierKey}}v`);
      // since we pasted in section, a new zone and a new copied button should be created
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        3,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON),
        3,
      );
      // and no new section should be created and space redistribution should be [6, 6]
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        2,
      );
      anvilLayout.sections.verifySectionDistribution("Section1", [6, 6]);

      // paste into zone
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Zone1"));
      cy.get("body").type(`{${modifierKey}}v`);
      // since we pasted in zone, a new copied button should be created, no new zone or section should be created
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON),
        4,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        3,
      );
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        2,
      );
    });

    it("2. Checks if the modal widget is pasted into the main canvas", () => {
      // drop a modal widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSMODAL,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            dropModal: true,
          },
        },
      );

      // copy the modal widget
      cy.get("body").type(`{${modifierKey}}c`);

      // press escape to close the modal
      agHelper.PressEscape();

      // select the canvas and paste into canvas
      agHelper.GetNClick(anvilLocators.mainCanvasSelector);
      cy.get("body").type(`{${modifierKey}}v`);
      // since we pasted in canvas, a new copied modal should be created
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetNameSelectorFromEntityExplorer("Modal1Copy"),
        1,
      );

      // close the modal
      agHelper.PressEscape();
    });

    it("3. Checks if no widget is selected, the main canvas is the destined parent", () => {
      // copy the button widget
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      cy.get("body").type(`{${modifierKey}}c`);

      // deselect widgets by clicking on the canvas
      cy.get(`${anvilLocators.mainCanvasSelector}`).click();

      // paste the button widget
      cy.get("body").type(`{${modifierKey}}v`);

      // since no widget is selected, the main canvas is the destined parent, so new section
      // and zone should be created and the button should be the last element in the main canvas
      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON),
        5,
      );

      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.SECTION),
        3,
      );

      agHelper.AssertElementLength(
        anvilLocators.anvilWidgetTypeSelector(anvilLocators.ZONE),
        4,
      );

      // the new button should be the last element in the main canvas
      cy.get(anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON))
        .last()
        .should("have.attr", "data-widget-name", "Button1Copy3");
    });

    it("4. Checks if the widget can be pasted in Modal Widget", () => {
      // copy the button widget
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      cy.get("body").type(`{${modifierKey}}c`);

      // drop a modal widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSMODAL,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            dropModal: true,
          },
        },
      );

      // paste the button widget
      cy.get("body").type(`{${modifierKey}}v`);

      // since the modal is open, the button should be pasted inside the modal
      agHelper.AssertElementLength(
        `${anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSMODAL)} ${anvilLocators.anvilWidgetTypeSelector(anvilLocators.WDSBUTTON)}`,
        1,
      );
    });
  },
);
