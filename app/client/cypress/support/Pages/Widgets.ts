export class Widgets {
  /**
   * Ensures that the bounding box of a widget fits perfectly with the component.
   *
   * @param {string} widgetSelector - Selector for the widget element.
   * @param {string} componentSelector - Selector for the component element.
   * @returns {void}
   */
  EnsureBoundingBoxFitsComponent(
    widgetSelector: string,
    componentSelector: string,
  ) {
    // TODO(aswathkk): Delta should be made 0.5 once the issue with list widget in mobile view is fixed.
    const DELTA = 1;
    cy.get(widgetSelector).then((widget) => {
      const widgetRect = widget.get(0).getBoundingClientRect();
      cy.get(componentSelector).then((component) => {
        const componentRect = component.get(0).getBoundingClientRect();
        expect(widgetRect.x).to.be.closeTo(componentRect.x - 2, DELTA);
        expect(widgetRect.y).to.be.closeTo(componentRect.y - 2, DELTA);
        expect(widgetRect.top).to.be.closeTo(componentRect.top - 2, DELTA);
        expect(widgetRect.bottom).to.be.closeTo(
          componentRect.bottom + 2,
          DELTA,
        );
        expect(widgetRect.left).to.be.closeTo(componentRect.left - 2, DELTA);
        expect(widgetRect.right).to.be.closeTo(componentRect.right + 2, DELTA);
        expect(widgetRect.height).to.be.closeTo(
          componentRect.height + 4,
          DELTA,
        );
        expect(widgetRect.width).to.be.closeTo(componentRect.width + 4, DELTA);
      });
    });
  }

  GetWidgetWidth(widgetSelector: string) {
    return cy.get(widgetSelector).invoke("width");
  }

  GetWidgetHeight(widgetSelector: string) {
    return cy.get(widgetSelector).invoke("height");
  }
}
