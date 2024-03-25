import { drop } from "lodash";
import { getWidgetSelector } from "../../locators/WidgetLocators";
import { ObjectsRegistry } from "../Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "./EditorNavigation";

interface DropTargetDetails {
  id?: string;
  name?: string;
}

interface DragDropWidgetOptions {
  skipWidgetSearch?: boolean;
  dropTargetDetails?: DropTargetDetails;
}

export class AnvilLayout {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;
  private agHelper = ObjectsRegistry.AggregateHelper;

  private getAnvilDropTargetSelectorFromOptions = (
    dropTarget?: DropTargetDetails,
  ) => {
    if (dropTarget) {
      if (dropTarget.id) {
        return `#${dropTarget.id}`;
      }
      if (dropTarget.name) {
        return `${getWidgetSelector(dropTarget.name.toLowerCase() as any)} ${
          this.locator._canvasSlider
        }`;
      }
    }
    return this.locator._canvasSlider;
  };

  private performDnDInAnvil(
    xPos: number,
    yPos: number,
    options = {} as DragDropWidgetOptions,
  ) {
    const dropAreaSelector = this.getAnvilDropTargetSelectorFromOptions(
      options.dropTargetDetails,
    );
    cy.get(dropAreaSelector)
      .first()
      .then((dropAreaDom) => {
        const { left, top } = dropAreaDom[0].getBoundingClientRect();
        cy.document()
          // to activate ANVIL canvas
          .trigger("mousemove", left + xPos, top + yPos, {
            eventConstructor: "MouseEvent",
            force: true,
          });
        this.agHelper.Sleep(200);
        cy.get(dropAreaSelector).first().trigger("mousemove", xPos, yPos, {
          eventConstructor: "MouseEvent",
          force: true,
        });
        this.agHelper.Sleep(200);
        cy.get(dropAreaSelector).first().trigger("mousemove", xPos, yPos, {
          eventConstructor: "MouseEvent",
          force: true,
        });
        cy.get(this.locator._canvasSlider)
          .first()
          .trigger("mouseup", xPos, yPos, {
            eventConstructor: "MouseEvent",
            force: true,
          });
      });
  }

  private startDraggingWidgetFromPane(widgetType: string) {
    cy.get(this.locator._widgetPageIcon(widgetType))
      .first()
      .trigger("dragstart", { force: true });
  }

  private setupWidgetPane(skipWidgetSearch: boolean, widgetType: string) {
    if (!skipWidgetSearch) {
      this.entityExplorer.SearchWidgetPane(widgetType);
    } else {
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchToAddNew();
    }
  }

  private DragNDropAnvilWidget(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    const { skipWidgetSearch = false } = options;
    this.setupWidgetPane(skipWidgetSearch, widgetType);
    this.startDraggingWidgetFromPane(widgetType);
    this.performDnDInAnvil(x, y, options);
  }

  public DragDropAnvilWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    this.DragNDropAnvilWidget(widgetType, x, y, options);
    this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
    this.agHelper.AssertElementExist(
      this.locator._anvilWidgetInCanvas(widgetType),
    );
    this.agHelper.Sleep(200); //waiting a bit for widget properties to open
  }
}
