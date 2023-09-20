import { debounce } from "lodash";
import type { RefObject } from "react";
import { ANVIL_LAYER, ANVIL_WIDGET, LAYOUT } from "./utils";
import store from "store";
import { readWidgetPositions } from "actions/autoLayoutActions";

/**
 * This Class's main function is to batch all the registered widgets, Flex layers and layout components
 * and dispatch an action to process all the affected widgets to determine all the widgets' positions
 *
 * This inturn acts as an observer to find out update widgets positions whenever the widget position changes
 */
class WidgetPositionsObserver {
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
    [layoutId: string]: {
      ref: RefObject<HTMLDivElement>;
      layoutId: string;
      canvasId: string;
    };
  } = {};

  //Queues to process the registered elements that changed
  private widgetsProcessQueue: {
    [widgetId: string]: boolean;
  } = {};
  private layersProcessQueue: { [canvasId: string]: number } = {};
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
          } else if (DOMId.indexOf(ANVIL_LAYER) > -1) {
            this.addLayerToProcess(DOMId);
          } else if (DOMId.indexOf(LAYOUT) > -1) {
            this.addLayoutToProcess(DOMId);
          }
        }
      }
    },
  );

  //Method to register widgets for resize observer changes
  public observeWidget(
    widgetId: string,
    widgetDOMId: string,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref.current) {
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

  //Method to register layers for resize observer changes
  public observeLayer(
    layerId: string,
    canvasId: string,
    layerIndex: number,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref?.current) {
      this.registeredLayers[layerId] = { ref, canvasId, layerIndex };
      this.resizeObserver.observe(ref.current);
    }
  }

  //Method to de register layers for resize observer changes
  public unObserveLayer(layerId: string) {
    const element = this.registeredLayers[layerId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredLayers[layerId];
  }

  //Method to register layouts for resize observer changes
  public observeLayout(
    layoutId: string,
    ref: RefObject<HTMLDivElement>,
    canvasId: string,
    id: string,
  ) {
    if (ref?.current) {
      this.registeredLayouts[layoutId] = { ref, canvasId, layoutId: id };
      this.resizeObserver.observe(ref.current);
    }
  }

  //Method to de register layouts for resize observer changes
  public unObserveLayout(layoutId: string) {
    const element = this.registeredLayouts[layoutId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredLayouts[layoutId];
  }

  //This method is triggered from the resize observer to add widgets to queue
  private addWidgetToProcess(widgetDOMId: string) {
    if (this.registeredWidgets[widgetDOMId]) {
      const widgetId = this.registeredWidgets[widgetDOMId].id;
      this.widgetsProcessQueue[widgetId] = true;
      this.debouncedProcessBatch();
    }
  }

  //This method is triggered from the resize observer to add layer to queue
  private addLayerToProcess(LayerId: string) {
    if (this.registeredLayers[LayerId]) {
      const { canvasId, layerIndex } = this.registeredLayers[LayerId];

      //If the layer in canvas already exist
      //and if the current layer is further higher than the previous one
      //add this layer to queue
      if (
        this.layersProcessQueue[canvasId] === undefined ||
        this.layersProcessQueue[canvasId] > layerIndex
      ) {
        this.layersProcessQueue[canvasId] = layerIndex;
      }
      this.debouncedProcessBatch();
    }
  }

  //This method is triggered from the resize observer to add layout to queue
  private addLayoutToProcess(layoutId: string) {
    if (this.registeredLayouts[layoutId]) {
      const id = this.registeredLayouts[layoutId].layoutId;
      this.layoutsProcessQueue[id] = true;
      this.debouncedProcessBatch();
    }
  }

  //Clear all process queues
  private clearProcessQueue() {
    this.widgetsProcessQueue = {};
    this.layersProcessQueue = {};
    this.layoutsProcessQueue = {};
  }

  //Dispatch all the changed elements to saga for further processing to update widget positions
  private processWidgetBatch() {
    store.dispatch(
      readWidgetPositions(
        { ...this.widgetsProcessQueue },
        { ...this.layersProcessQueue },
        { ...this.layoutsProcessQueue },
      ),
    );
    this.clearProcessQueue();
  }
}

export const widgetPositionsObserver = new WidgetPositionsObserver();
