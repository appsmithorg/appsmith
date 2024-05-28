import { ObjectsRegistry } from "../../Objects/Registry";
import { AnvilDnD } from "./AnvilDnD";
import { AnvilSections } from "./AnvilSections";

export class AnvilLayout extends AnvilDnD {
  public sections = new AnvilSections();
  public verifyParentChildRelationship(parentName: string, childName: string) {
    const parentWidgetSelector = this.anvilWidgetNameSelector(parentName);
    const childWidgetSelector = this.anvilWidgetNameSelector(childName);
    // check if childWidgetSelector is inside parentWidgetSelector
    cy.get(parentWidgetSelector).within(() => {
      cy.get(childWidgetSelector);
    });
    // check if there are no other widgets in between parent and child
    cy.get(childWidgetSelector)
      .parentsUntil(parentWidgetSelector, this.anvilWidgetSelector)
      .should("have.length", 0);
  }
}
