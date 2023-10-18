import { debounce } from "lodash";
import type { RefObject } from "react";
import {
  ANVIL_WIDGET,
  LAYOUT,
  getAnvilLayoutDOMId,
  getAnvilWidgetDOMId,
} from "./utils";
import store from "store";
import { readLayoutElementPositions } from "layoutSystems/anvil/integrations/actions";

/**
 * A singleton class that registers all the widgets and layouts that are present on the canvas
 * This class uses a ResizeObserver to observe all the registered elements
 * Whenever any of the registered elements changes size, the ResizeObserver triggers
 * This class then adds the changed elements to a queue to batch process them
 */
class LayoutElementPositionObserver {
  // Objects to store registered elements
  private registeredWidgets: {
    [widgetDOMId: string]: { ref: RefObject<HTMLDivElement>; id: string };
  } = {};
  private registeredLayers: {
    [layerId: string]: {
      ref: RefObject<HTMLDivElement>;
      canvasId: string;
      layerIndex: number;
    };
  } = {};
  private registeredLayouts: {
    [layoutDOMId: string]: {
      ref: RefObject<HTMLDivElement>;
      layoutId: string;
      canvasId: string;
      isDropTarget: boolean;
    };
  } = {};

  //Queues to process the registered elements that changed
  private widgetsProcessQueue: {
    [widgetId: string]: boolean;
  } = {};
  private layoutsProcessQueue: { [key: string]: boolean } = {};

  private debouncedProcessBatch = debounce(this.processWidgetBatch, 200);

  // All the registered elements are registered with this Resize observer
  // When any of the elements changes size this observer triggers it
  // Add the elements are added to queue to further batch and process
  private resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry?.target?.id) {
          const DOMId = entry?.target?.id;
          if (DOMId.indexOf(ANVIL_WIDGET) > -1) {
            this.addWidgetToProcess(DOMId);
          } else if (DOMId.indexOf(LAYOUT) > -1) {
            this.addLayoutToProcess(DOMId);
          }
        }
      }
    },
  );

  //Method to register widgets for resize observer changes
  public observeWidget(widgetId: string, ref: RefObject<HTMLDivElement>) {
    if (ref.current) {
      const widgetDOMId = getAnvilWidgetDOMId(widgetId);
      this.registeredWidgets[widgetDOMId] = { ref, id: widgetId };
      this.resizeObserver.observe(ref.current);
      this.addWidgetToProcess(widgetDOMId);
    }
  }

  //Method to de register widgets for resize observer changes
  public unObserveWidget(widgetDOMId: string) {
    const element = this.registeredWidgets[widgetDOMId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredWidgets[widgetDOMId];
  }

  //Method to register layouts for resize observer changes
  public observeLayout(
    layoutId: string,
    canvasId: string,
    isDropTarget: boolean,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref?.current) {
      this.registeredLayouts[layoutId] = this.registeredLayouts[
        getAnvilLayoutDOMId(canvasId, layoutId)
      ] = {
        ref,
        canvasId,
        layoutId,
        isDropTarget,
      };
      this.resizeObserver.observe(ref.current);
    }
  }

  //Method to de register layouts for resize observer changes
  public unObserveLayout(layoutDOMId: string) {
    const element = this.registeredLayouts[layoutDOMId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredLayouts[layoutDOMId];
  }

  //This method is triggered from the resize observer to add widgets to queue
  private addWidgetToProcess(widgetDOMId: string) {
    if (this.registeredWidgets[widgetDOMId]) {
      const widgetId = this.registeredWidgets[widgetDOMId].id;
      this.widgetsProcessQueue[widgetId] = true;
      this.debouncedProcessBatch();
    }
  }

  //This method is triggered from the resize observer to add layout to queue
  private addLayoutToProcess(layoutDOMId: string) {
    if (this.registeredLayouts[layoutDOMId]) {
      this.layoutsProcessQueue[layoutDOMId] = true;
      this.debouncedProcessBatch();
    }
  }

  //Clear all process queues
  private clearProcessQueue() {
    this.widgetsProcessQueue = {};
    this.layoutsProcessQueue = {};
  }

  //Dispatch all the changed elements to saga for further processing to update widget positions
  private processWidgetBatch() {
    store.dispatch(
      readLayoutElementPositions(
        { ...this.widgetsProcessQueue },
        { ...this.layoutsProcessQueue },
      ),
    );
    this.clearProcessQueue();
  }

  // Getters for registered elements
  public getRegisteredWidgets() {
    return this.registeredWidgets;
  }

  // Getters for registered elements
  public getRegisteredLayouts() {
    return this.registeredLayouts;
  }
}

export const positionObserver = new LayoutElementPositionObserver();
