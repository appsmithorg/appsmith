import { ObjectsRegistry } from "../Objects/Registry";

type WidgetType =
  | "TEXT_WIDGET"
  | "TABLE_WIDGET_V2"
  | "BUTTON_WIDGET"
  | "INPUT_WIDGET_V2"
  | "CONTAINER_WIDGET";

export class CanvasHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;
  private locators = {
    _widgetPaneCTA: "[data-cy='widget-page-cta']",
    _widgetPane: "[data-cy='widget-sidebar-scrollable-wrapper']",
    _droppableArea: "#div-dragarena-0",
  };

  public OpenWidgetPane() {
    const openPane = (isCTAVisible: boolean) => {
      if (isCTAVisible) {
        const widgetPaneVisible = this.agHelper.DoesElementExist(
          this.locators._widgetPane,
        );
        widgetPaneVisible.then((value) => {
          if (!value) {
            this.agHelper.GetNClick(this.locators._widgetPaneCTA);
          }
        });
      } else {
        this.agHelper.GetNClick(this.commonLocators._openWidget);
      }
    };

    const ctaVisible = this.agHelper.DoesElementExist(
      this.locators._widgetPaneCTA,
    );

    ctaVisible.then(openPane);
  }

  public CloseWidgetPane() {
    this.agHelper.GetNClick(this.locators._widgetPaneCTA);
  }

  public DragNDropFromTopbar(
    widgetType: WidgetType,
    coordinates: { x: number; y: number },
  ) {
    const { x, y } = coordinates;
    const selector = `[data-cy='popular-widget-${widgetType}']`;
    cy.wait(500);
    cy.get(selector)
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    cy.get(this.locators._droppableArea)
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
    this.agHelper.AssertAutoSave();
  }
}
