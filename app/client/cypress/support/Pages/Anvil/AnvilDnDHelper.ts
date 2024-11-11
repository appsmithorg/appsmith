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
  dropModal?: boolean;
}

interface DragDropWidgetOptions {
  skipWidgetSearch?: boolean;
  dropTargetDetails?: DropTargetDetails;
}

export class AnvilDnDHelper {
  public skipWidgetSearch: any;
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;
  protected agHelper = ObjectsRegistry.AggregateHelper;
  private getAnvilDropTargetSelectorFromOptions = (
    dropTarget?: DropTargetDetails,
  ) => {
    if (dropTarget) {
      if (dropTarget.dropModal) {
        return anvilLocators.anvilDetachedWidgetsDropArena;
      }
      if (dropTarget.id) {
        return `#${dropTarget.id}`;
      }
      if (dropTarget.name) {
        return `${anvilLocators.anvilWidgetNameSelector(dropTarget.name)} ${
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
    cy.get(dropAreaSelector).first().realMouseMove(xPos, yPos);
    cy.get(dropAreaSelector).first().realMouseMove(xPos, yPos);
    if (!options.dropTargetDetails?.dropModal) {
      // no need to show highlight for modal drop
      cy.get(this.locator._anvilDnDHighlight);
    }
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

  /* This function will drag and drop a new widget of the specified type to the specified x and y pixel coordinates.
    The x and y coordinates are relative to the main canvas's top left corner on the viewport */
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

  /* If __only one__ widget is selected on the canvas, 
    this function will move the widget to the specified x and y coordinates using the widget name component. 
    In this case, the widgetName argument is not necessary */
  // This function uses the widget name on canvas UI to drag and drop the widget
  public MoveAnvilWidget(
    widgetName?: string,
    x = 300,
    y = 100,
    options = {} as DragDropWidgetOptions,
  ) {
    this.agHelper
      .AssertElementExist(anvilLocators.mainCanvasSelector)
      .then((mainCanvas) => {
        const mainCanvasX = mainCanvas.position().left;
        const mainCanvasY = mainCanvas.position().top;
        const widgetSelector = widgetName
          ? anvilLocators.anvilWidgetNameSelector(widgetName)
          : anvilLocators.anvilOnCanvasWidgetNameSelector;
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
