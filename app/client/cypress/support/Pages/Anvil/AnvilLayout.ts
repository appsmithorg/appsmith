import { AnvilDnDHelper } from "./AnvilDnDHelper";
import { AnvilSectionsZonesHelper } from "./AnvilSectionsZonesHelper";
import { anvilLocators } from "./Locators";
export class AnvilLayout {
  public sections = new AnvilSectionsZonesHelper();
  public dnd = new AnvilDnDHelper();

  public verifyWidgetDoesNotExist(widgetName: string) {
    const widgetSelector = anvilLocators.anvilWidgetNameSelector(widgetName);
    cy.get(widgetSelector).should("not.exist");
  }

  public verifyAnvilModalIsClosed(widgetName: string) {
    this.verifyWidgetDoesNotExist(widgetName);
  }

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
