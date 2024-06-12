import { getWidgetSelector } from "../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "../EditorNavigation";
import { anvilLocators } from "./Locators";

interface DropTargetDetails {
  id?: string;
  name?: string;
}

interface DragDropWidgetOptions {
  skipWidgetSearch?: boolean;
  dropTargetDetails?: DropTargetDetails;
}

export class AnvilDnDHelper {
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;
  protected agHelper = ObjectsRegistry.AggregateHelper;
  private getAnvilDropTargetSelectorFromOptions = (
    dropTarget?: DropTargetDetails,
  ) => {
    if (dropTarget) {
      if (dropTarget.id) {
        return `#${dropTarget.id}`;
      }
      if (dropTarget.name) {
        return `${getWidgetSelector(dropTarget.name.toLowerCase() as any)} ${
          anvilLocators.anvilDnDListener
        }`;
      }
    }
    return `${anvilLocators.mainCanvasSelector} > ${anvilLocators.anvilDnDListener}`;
  };
  private performDnDInAnvil(
    xPos: number,
    yPos: number,
    options = {} as DragDropWidgetOptions,
  ) {
    const dropAreaSelector = this.getAnvilDropTargetSelectorFromOptions(
      options.dropTargetDetails,
    );
    cy.document()
      // to activate ANVIL canvas
      .trigger("mousemove", xPos, yPos, {
        eventConstructor: "MouseEvent",
        force: true,
      });
    this.agHelper.Sleep(200);
    cy.get(dropAreaSelector).first().trigger("mouseover", xPos, yPos, {
      eventConstructor: "MouseEvent",
      force: true,
    });
    cy.get(dropAreaSelector).first().trigger("mousemove", xPos, yPos, {
      eventConstructor: "MouseEvent",
      force: true,
    });
    cy.get(dropAreaSelector).first().trigger("mousemove", xPos, yPos, {
      eventConstructor: "MouseEvent",
      force: true,
    });
    cy.get(this.locator._anvilDnDHighlight);
    cy.get(dropAreaSelector).first().trigger("mouseup", xPos, yPos, {
      eventConstructor: "MouseEvent",
      force: true,
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
  public DragDropNewAnvilWidgetNVerify(
    widgetType: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    this.agHelper
      .AssertElementExist(anvilLocators.mainCanvasSelector)
      .then((mainCanvas) => {
        const mainCanvasX = mainCanvas.position().left;
        const mainCanvasY = mainCanvas.position().top;
        this.DragNDropAnvilWidget(
          widgetType,
          x + mainCanvasX,
          y + mainCanvasY,
          options,
        );
        this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
        this.agHelper.AssertElementExist(
          anvilLocators.anvilWidgetTypeSelector(widgetType),
        );
        this.agHelper.Sleep(200); //waiting a bit for widget properties to open
      });
  }

  public MoveAnvilWidget(
    widgetName: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    this.agHelper
      .AssertElementExist(anvilLocators.mainCanvasSelector)
      .then((mainCanvas) => {
        const mainCanvasX = mainCanvas.position().left;
        const mainCanvasY = mainCanvas.position().top;
        const widgetSelector =
          anvilLocators.anvilWidgetNameSelector(widgetName);
        // perform mouseover to focus the widget before drag to allow dragging
        cy.get(widgetSelector).first().trigger("mouseover", { force: true });
        cy.get(widgetSelector).first().trigger("dragstart", { force: true });
        this.performDnDInAnvil(x + mainCanvasX, y + mainCanvasY, options);
        this.agHelper.AssertAutoSave(); //settling time for widget on canvas!
        this.agHelper.AssertElementExist(widgetSelector);
        this.agHelper.Sleep(200); //waiting a bit for widget properties to open
      });
  }
}
