import { getWidgetSelector } from "../../locators/WidgetLocators";
import { ObjectsRegistry } from "../Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "./EditorNavigation";

type DragDropWidgetOptions = {
  skipWidgetSearch?: boolean;
  widgetNameToDropInto?: string;
};
export class AnvilLayout {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;
  private agHelper = ObjectsRegistry.AggregateHelper;
  public DragNDropAnvilWidget(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    const { skipWidgetSearch } = options;
    if (!skipWidgetSearch) {
      this.entityExplorer.SearchWidgetPane(widgetType);
    } else {
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();
      cy.focused().blur();
    }

    cy.get(this.locator._widgetPageIcon(widgetType))
      .first()
      .trigger("dragstart", { force: true });
    const dropAreaSelector = options.widgetNameToDropInto
      ? `${getWidgetSelector(
          options.widgetNameToDropInto.toLowerCase() as any,
        )} ${this.locator._dropHere}`
      : this.locator._dropHere;
    cy.get(dropAreaSelector)
      .first()
      .then((dropAreaDom) => {
        const { left, top } = dropAreaDom[0].getBoundingClientRect();
        cy.document()
          // to activate ANVIL canvas
          .trigger("mousemove", left + x, top + y, {
            eventConstructor: "MouseEvent",
            clientX: left + x,
            clientY: top + y,
            force: true,
          });
        this.agHelper.Sleep(200);
        cy.get(dropAreaSelector).first().trigger("mousemove", x, y, {
          eventConstructor: "MouseEvent",
          force: true,
        });
        this.agHelper.Sleep(200);
        cy.get(dropAreaSelector).first().trigger("mousemove", x, y, {
          eventConstructor: "MouseEvent",
          force: true,
        });
        cy.get(this.locator._dropHere).first().trigger("mouseup", x, y, {
          eventConstructor: "MouseEvent",
          force: true,
        });
      });
  }

  public DragDropAnvilWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    this.DragNDropAnvilWidget(widgetType, x, y, options);
    this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
    this.agHelper.AssertElementExist(this.locator._widgetInCanvas(widgetType));
    this.agHelper.Sleep(200); //waiting a bit for widget properties to open
  }
}
