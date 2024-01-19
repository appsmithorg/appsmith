import EditorNavigation from "./EditorNavigation";

class Canvas {
  selectMultipleWidgets(widgetNames: string[]) {
    EditorNavigation.ShowCanvas();
    for (const widget of widgetNames) {
      // Ctrl click on widget name component
      cy.get(`div[data-widgetname-cy='${widget}']`).realHover();
      cy.get(`div[data-testid="t--settings-controls-positioned-wrapper"]`)
        .contains(widget)
        .click({
          force: true,
          ctrlKey: true,
        });
    }
  }
}

export default new Canvas();
