import { debounce } from "lodash";
import type { RefObject } from "react";
import {
  ANVIL_WIDGET,
  LAYOUT,
  extractLayoutIdFromLayoutDOMId,
  extractWidgetIdFromAnvilWidgetDOMId,
  getAnvilLayoutDOMId,
  getAnvilWidgetDOMId,
} from "./utils";
import store from "store";
import {
  deleteLayoutElementPositions,
  readLayoutElementPositions,
} from "layoutSystems/anvil/integrations/actions";
import ResizeObserver from "resize-observer-polyfill";
import type { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
// Note: We have a singleton observer in `utils/resizeObserver.ts`. I noticed this too late and the API is not easy to adapt in this file.
// Adding this to the list of things to fix in the future.
/**
 * A singleton class that registers all the widgets and layouts that are present on the canvas
 * This class uses a ResizeObserver to observe all the registered elements
 * Whenever any of the registered elements changes size, the ResizeObserver triggers
 * This class then triggers a process call which is debounced.
 */
type LayoutOrderArray = string[];

class LayoutElementPositionObserver {
  // Objects to store registered elements
  private registeredWidgets: {
    [widgetDOMId: string]: {
      ref: RefObject<HTMLDivElement>;
      id: string;
      layoutId: string;
      isDetached?: boolean;
    };
  } = {};

  private registeredLayouts: {
    [layoutDOMId: string]: {
      ref: RefObject<HTMLDivElement>;
      layoutId: string;
      canvasId: string;
      parentDropTarget: string;
      isDropTarget: boolean;
      layoutType: LayoutComponentTypes;
    };
  } = {};

  private dropTargetsDomIdsOrder: LayoutOrderArray = [];

  private mutationOptions: MutationObserverInit = {
    attributes: true,
    attributeFilter: ["class"],
  };

  private debouncedProcessBatch = debounce(this.processWidgetBatch, 200);

  // All the registered elements are registered with this Resize observer
  // When any of the elements changes size this observer triggers it
  // Add the elements are added to queue to further batch and process
  private resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        // If the entry's anvil_widget_ identifier is not present as an id
        // Check if it exists as a className
        // If it does, then use that as the identifier
        let DOMIdentifier = entry?.target?.id;

        if (!DOMIdentifier) {
          const classList: DOMTokenList = entry?.target?.classList;

          if (classList && classList.length > 0) {
            for (let i = 0; i < classList.length; i++) {
              if (classList[i].indexOf(ANVIL_WIDGET) > -1) {
                DOMIdentifier = classList[i];
                break;
              }
            }
          }
        }

        if (DOMIdentifier) this.trackEntry(DOMIdentifier);
      }
    },
  );

  private mutationObserver = new MutationObserver(
    (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const DOMId: string = (mutation?.target as HTMLElement)?.id;

          if (DOMId) {
            this.trackEntry(DOMId);
          }
        }
      }
    },
  );

  //Method to register widgets for resize observer changes
  public observeWidget(
    widgetId: string,
    layoutId: string,
    ref: RefObject<HTMLDivElement>,
    isDetached?: boolean,
  ) {
    if (ref.current) {
      if (!this.registeredWidgets.hasOwnProperty(widgetId)) {
        const widgetDOMId = getAnvilWidgetDOMId(widgetId);

        this.registeredWidgets[widgetDOMId] = {
          ref,
          id: widgetId,
          layoutId,
          isDetached: !!isDetached,
        };

        this.resizeObserver.observe(ref.current);
        this.mutationObserver.observe(ref.current, this.mutationOptions);
      }
    }
  }

  //Method to de register widgets for resize observer changes
  public unObserveWidget(widgetDOMId: string) {
    const element = this.registeredWidgets[widgetDOMId]?.ref?.current;

    if (element) {
      this.resizeObserver.unobserve(element);
    }

    delete this.registeredWidgets[widgetDOMId];
    store.dispatch(
      deleteLayoutElementPositions([
        extractWidgetIdFromAnvilWidgetDOMId(widgetDOMId),
      ]),
    );
  }

  //Method to register layouts for resize observer changes
  public observeLayout(
    layoutId: string,
    canvasId: string,
    parentDropTarget: string,
    isDropTarget: boolean,
    layoutType: LayoutComponentTypes,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref?.current) {
      const layoutDOMId = getAnvilLayoutDOMId(canvasId, layoutId);

      if (!this.registeredLayouts.hasOwnProperty(layoutDOMId)) {
        this.registeredLayouts[layoutId] = this.registeredLayouts[layoutDOMId] =
          {
            ref,
            canvasId,
            layoutId,
            parentDropTarget,
            isDropTarget,
            layoutType,
          };

        if (
          isDropTarget &&
          !this.dropTargetsDomIdsOrder.includes(layoutDOMId)
        ) {
          const parentIndex = this.dropTargetsDomIdsOrder.findIndex(
            (each) => each === parentDropTarget,
          );

          if (parentIndex === -1) {
            // main canvas drop target
            this.dropTargetsDomIdsOrder.push(layoutDOMId);
          } else {
            this.dropTargetsDomIdsOrder.splice(parentIndex, 0, layoutDOMId);
          }
        }

        this.resizeObserver.observe(ref.current);
        this.mutationObserver.observe(ref.current, this.mutationOptions);
      }
    }
  }

  //Method to de register layouts for resize observer changes
  public unObserveLayout(layoutDOMId: string) {
    const layoutObj = this.registeredLayouts[layoutDOMId];
    const element = layoutObj?.ref?.current;

    if (element) {
      this.resizeObserver.unobserve(element);
    }

    const { isDropTarget } = layoutObj;

    if (isDropTarget) {
      const layoutIndex = this.dropTargetsDomIdsOrder.findIndex(
        (each) => each === layoutDOMId,
      );

      if (layoutIndex !== -1) {
        this.dropTargetsDomIdsOrder.splice(layoutIndex, 1);
      }
    }

    delete this.registeredLayouts[layoutDOMId];
    store.dispatch(
      deleteLayoutElementPositions([
        extractLayoutIdFromLayoutDOMId(layoutDOMId),
      ]),
    );
  }

  //This method is triggered from the resize observer to add widgets to queue
  private addWidgetToProcess(widgetDOMId: string) {
    if (this.registeredWidgets[widgetDOMId]) {
      this.debouncedProcessBatch();
    }
  }

  //This method is triggered from the resize observer to add layout to queue
  private addLayoutToProcess(layoutDOMId: string) {
    if (this.registeredLayouts[layoutDOMId]) {
      this.debouncedProcessBatch();
    }
  }

  //Dispatch all the changed elements to saga for further processing to update widget positions
  // We do this when the system is idle, because this is a heavy operation and could block the UI thread
  // Note: Watch out for idle callback timeout
  private processWidgetBatch() {
    window.requestIdleCallback(
      () => {
        store.dispatch(readLayoutElementPositions());
      },
      { timeout: 2000 },
      // We assume 2 seconds is enough for the idle callback to trigger,
      // if not, it is best to compute, so that users don't see incorrect positions
    );
  }

  // Getters for registered elements
  public getRegisteredWidgets() {
    return this.registeredWidgets;
  }

  // Getters for registered elements
  public getRegisteredLayouts() {
    return this.registeredLayouts;
  }

  public getDropTargetDomIdsOrder() {
    return this.dropTargetsDomIdsOrder;
  }

  private trackEntry(DOMId: string) {
    if (
      DOMId.indexOf(ANVIL_WIDGET) > -1 ||
      this.registeredWidgets[DOMId]?.isDetached
    ) {
      this.addWidgetToProcess(DOMId);
    } else if (DOMId.indexOf(LAYOUT) > -1) {
      this.addLayoutToProcess(DOMId);
    }
  }
}

export const positionObserver = new LayoutElementPositionObserver();
