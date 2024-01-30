import type { ModalWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import * as config from "./../config";
import type { AnvilConfig } from "WidgetProvider/constants";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@design-system/widgets";
import React from "react";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { ModalBody } from "@design-system/widgets";
import { WDS_MODAL_WIDGET_CLASSNAME } from "widgets/wds/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "layoutSystems/anvil/utils/paste/types";
import { call } from "redux-saga/effects";
import { pasteWidgetsIntoMainCanvas } from "layoutSystems/anvil/utils/paste/mainCanvasPasteUtils";

const modalBodyStyles: React.CSSProperties = {
  minHeight: "var(--sizing-16)",
  maxHeight:
    "calc(var(--canvas-height) - var(--outer-spacing-4) - var(--outer-spacing-4) - var(--outer-spacing-4) - 100px)",
};

class WDSModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static type = "WDS_MODAL_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static *performPasteOperation(
    allWidgets: CanvasWidgetsReduxState,
    copiedWidgets: CopiedWidgetData[],
    destinationInfo: PasteDestinationInfo,
    widgetIdMap: Record<string, string>,
    reverseWidgetIdMap: Record<string, string>,
  ) {
    const res: PastePayload = yield call(
      pasteWidgetsIntoMainCanvas,
      allWidgets,
      copiedWidgets,
      destinationInfo,
      widgetIdMap,
      reverseWidgetIdMap,
    );
    return res;
  }

  onModalClose = () => {
    if (this.props.onClose) {
      super.executeAction({
        triggerPropertyName: "onClose",
        dynamicString: this.props.onClose,
        event: {
          type: EventType.ON_MODAL_CLOSE,
        },
      });
    }
    this.props.updateWidgetMetaProperty("isVisible", false);
    this.selectWidgetRequest(SelectionRequestType.Empty);
    this.unfocusWidget();
  };

  onSubmitClick = () => {
    if (this.props.onSubmit) {
      super.executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: this.props.onSubmit,
        event: {
          type: EventType.ON_MODAL_SUBMIT,
        },
      });
    }
  };

  getModalVisibility = () => {
    if (this.props.selectedWidgetAncestry) {
      return (
        this.props.selectedWidgetAncestry.includes(this.props.widgetId) ||
        this.props.isVisible
      );
    }
    return this.props.isVisible;
  };

  getWidgetView() {
    const closeText = this.props.cancelButtonText || "Cancel";

    const submitText = this.props.showSubmitButton
      ? this.props.submitButtonText || "Submit"
      : undefined;

    return (
      <Modal
        isOpen={this.getModalVisibility()}
        onClose={this.onModalClose}
        size={this.props.size}
      >
        <ModalContent className={this.props.className}>
          {this.props.showHeader && <ModalHeader title={this.props.title} />}
          <ModalBody
            className={WDS_MODAL_WIDGET_CLASSNAME}
            style={modalBodyStyles}
          >
            <LayoutProvider {...this.props} />
          </ModalBody>
          {this.props.showFooter && (
            <ModalFooter
              closeText={closeText}
              onSubmit={submitText ? this.onSubmitClick : undefined}
              submitText={submitText}
            />
          )}
        </ModalContent>
      </Modal>
    );
  }
}

export { WDSModalWidget };
