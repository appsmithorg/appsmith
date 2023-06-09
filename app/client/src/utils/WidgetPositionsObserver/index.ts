import _ from "lodash";
import type { RefObject } from "react";
import { AUTO_LAYER, AUTO_WIDGET } from "./utils";
import store from "store";
import { readWidgetPositions } from "actions/autoLayoutActions";

class WidgetPositionsObserver {
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

  private widgetsProcessQueue: {
    [widgetId: string]: boolean;
  } = {};
  private layersProcessQueue: { [canvasId: string]: number } = {};

  private debouncedProcessBatch = _.debounce(this.processWidgetBatch, 200);

  private resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry?.target?.id) {
          const DOMId = entry?.target?.id;
          if (DOMId.indexOf(AUTO_WIDGET) > -1) {
            this.addWidgetToProcess(DOMId);
          } else if (DOMId.indexOf(AUTO_LAYER) > -1) {
            this.addLayerToProcess(DOMId);
          }
        }
      }
    },
  );

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

  public unObserveWidget(widgetDOMId: string) {
    const element = this.registeredWidgets[widgetDOMId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredWidgets[widgetDOMId];

    //Add code to batch and delete widgetIds from redux
  }

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

  public unObserveLayer(layerId: string) {
    const element = this.registeredLayers[layerId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredLayers[layerId];
  }

  private addWidgetToProcess(widgetDOMId: string) {
    if (this.registeredWidgets[widgetDOMId]) {
      const widgetId = this.registeredWidgets[widgetDOMId].id;
      this.widgetsProcessQueue[widgetId] = true;
      this.debouncedProcessBatch();
    }
  }

  private addLayerToProcess(LayerId: string) {
    if (this.registeredLayers[LayerId]) {
      const { canvasId, layerIndex } = this.registeredLayers[LayerId];

      if (
        this.layersProcessQueue[canvasId] === undefined ||
        this.layersProcessQueue[canvasId] > layerIndex
      ) {
        this.layersProcessQueue[canvasId] = layerIndex;
      }
      this.debouncedProcessBatch();
    }
  }

  private clearProcessQueue() {
    this.widgetsProcessQueue = {};
    this.layersProcessQueue = {};
  }

  private processWidgetBatch() {
    store.dispatch(
      readWidgetPositions(
        { ...this.widgetsProcessQueue },
        { ...this.layersProcessQueue },
      ),
    );
    this.clearProcessQueue();
  }
}

export const widgetPositionsObserver = new WidgetPositionsObserver();
