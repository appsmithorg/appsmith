import EditorNavigation from "./EditorNavigation";

class Canvas {
  selectMultipleWidgets(widgetNames: string[]) {
    EditorNavigation.ShowCanvas();
    for (const widget of widgetNames) {
      // Ctrl click on widget name component
      cy.get(`#widget_name_${widget}`).click({
        force: true,
        ctrlKey: true,
      });
    }
  }
}

export default new Canvas();
