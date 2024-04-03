import { agHelper } from "../Objects/ObjectsCore";
import EditorNavigation from "./EditorNavigation";

class Canvas {
  selectMultipleWidgets(widgetNames: string[]) {
    EditorNavigation.ShowCanvas();
    for (const widget of widgetNames) {
      // Ctrl click on widget name component
      this.commandClickWidget(widget);
    }
  }

  hoverOnWidget(widgetType: string) {
    const selector = `.t--draggable-${widgetType}`;
    agHelper.Sleep(500);
    cy.get(selector).first().trigger("mouseover", { force: true }).wait(500);
  }

  commandClickWidget(widgetName: string) {
    cy.get(`div[data-widgetname-cy='${widgetName}']`).realHover();
    cy.get(`div[data-testid="t--settings-controls-positioned-wrapper"]`)
      .contains(widgetName)
      .click({
        force: true,
        ctrlKey: true,
      });
  }
}

export default new Canvas();
