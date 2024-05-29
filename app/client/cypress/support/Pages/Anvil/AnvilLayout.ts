import { AnvilDnD } from "./AnvilDnD";
import { AnvilSections } from "./AnvilSections";
import { anvilLocators } from "./Locators";

export class AnvilLayout extends AnvilDnD {
  public sections = new AnvilSections();
  public verifyParentChildRelationship(parentName: string, childName: string) {
    const parentWidgetSelector =
      anvilLocators.anvilWidgetNameSelector(parentName);
    const childWidgetSelector =
      anvilLocators.anvilWidgetNameSelector(childName);
    // check if childWidgetSelector is inside parentWidgetSelector
    cy.get(parentWidgetSelector).within(() => {
      cy.get(childWidgetSelector);
    });
    // check if there are no other widgets in between parent and child
    cy.get(childWidgetSelector)
      .parentsUntil(parentWidgetSelector, anvilLocators.anvilWidgetSelector)
      .should("have.length", 0);
  }
}
