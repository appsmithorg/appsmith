import _ from "lodash";
import type { RefObject } from "react";
import {
  AUTO_LAYER,
  AUTO_WIDGET,
  getAffectedWidgetsFromLayer,
  getAutoWidgetId,
} from "./utils";
import store from "store";

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
    [widgetDOMId: string]: RefObject<HTMLDivElement>;
  } = {};

  private debouncedProcessBatch = _.debounce(this.processWidgetBatch, 100);

  private resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry?.target?.id) {
          const DOMId = entry?.target?.id;
          if (DOMId.indexOf(AUTO_WIDGET) > -1) {
            this.addWidgetToProcess(DOMId);
          } else if (DOMId.indexOf(AUTO_LAYER) > -1) {
            this.processLayerResize(DOMId);
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

  private processLayerResize(layerId: string) {
    if (this.registeredLayers[layerId]) {
      const { canvasId, layerIndex } = this.registeredLayers[layerId];

      const affectedWidgets = getAffectedWidgetsFromLayer(
        store.getState(),
        canvasId,
        layerIndex,
      );

      for (const widgetId of affectedWidgets) {
        this.addWidgetToProcess(getAutoWidgetId(widgetId));
      }
    }
  }

  private addWidgetToProcess(widgetDOMId: string) {
    if (
      this.registeredWidgets[widgetDOMId] &&
      !this.widgetsProcessQueue[widgetDOMId]
    ) {
      this.widgetsProcessQueue[widgetDOMId] =
        this.registeredWidgets[widgetDOMId].ref;
      this.debouncedProcessBatch();
    }
  }

  private clearWidgetProcessQueue() {
    this.widgetsProcessQueue = {};
  }

  private processWidgetBatch() {
    const perfTimer = performance.now();
    const widgetsToProcess = { ...this.widgetsProcessQueue };
    this.clearWidgetProcessQueue();

    const widgetDimensions: {
      [widgetId: string]: {
        left: number;
        top: number;
        height: number;
        width: number;
      };
    } = {};

    const mainCanvasElement = document.querySelector(".flex-container-0");

    const mainRect = mainCanvasElement?.getBoundingClientRect();

    const { left = 0, top = 0 } = mainRect || {};

    for (const [id, ref] of Object.entries(widgetsToProcess)) {
      if (ref && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        widgetDimensions[this.registeredWidgets[id].id] = {
          left: rect.left - left,
          top: rect.top - top,
          height: rect.height,
          width: rect.width,
        };
      }
    }

    console.log(
      "widgetDimensions in " + (performance.now() - perfTimer) + "ms: ",
      widgetDimensions,
    );
  }
}

export const widgetPositionsObserver = new WidgetPositionsObserver();
