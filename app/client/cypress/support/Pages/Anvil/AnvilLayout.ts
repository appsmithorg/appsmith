import { ObjectsRegistry } from "../../Objects/Registry";
import { AnvilDnD } from "./AnvilDnD";
import { AnvilSections } from "./AnvilSections";
import { AnvilSelectors } from "./AnvilSelectors";

export class AnvilLayout extends AnvilDnD {
  public sections = new AnvilSections();
  public verifyParentChildRelationship(parentName: string, childName: string) {
    const parentWidgetSelector =
      AnvilSelectors.anvilWidgetNameSelector(parentName);
    const childWidgetSelector =
      AnvilSelectors.anvilWidgetNameSelector(childName);
    // check if childWidgetSelector is inside parentWidgetSelector
    cy.get(parentWidgetSelector).within(() => {
      cy.get(childWidgetSelector);
    });
    // check if there are no other widgets in between parent and child
    cy.get(childWidgetSelector)
      .parentsUntil(parentWidgetSelector, AnvilSelectors.anvilWidgetSelector)
      .should("have.length", 0);
  }
}
