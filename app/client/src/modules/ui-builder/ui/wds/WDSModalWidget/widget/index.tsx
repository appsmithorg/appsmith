import type { ModalWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import * as config from "./../config";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "@appsmith/wds";
import React from "react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { ModalBody } from "@appsmith/wds";
import { WDS_MODAL_WIDGET_CLASSNAME } from "modules/ui-builder/ui/wds/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "layoutSystems/anvil/utils/paste/types";
import { call } from "redux-saga/effects";
import { pasteWidgetsIntoMainCanvas } from "layoutSystems/anvil/utils/paste/mainCanvasPasteUtils";
import { ModalLayoutProvider } from "layoutSystems/anvil/layoutComponents/ModalLayoutProvider";
import styles from "./styles.module.css";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { widgetTypeClassname } from "widgets/WidgetUtils";
import { AnvilDataAttributes } from "modules/ui-builder/ui/wds/constants";

class WDSModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static type = "WDS_MODAL_WIDGET";

  constructor(props: ModalWidgetProps) {
    super(props);

    this.state = {
      isVisible: this.getModalVisibility(),
    };
  }

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

  static getMethods() {
    return config.methodsConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      name: "{{this.widgetName}}",
    };
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
    if (!this.props.disableWidgetInteraction && this.props.onClose) {
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
    if (this.props.onSubmit && this.props.showSubmitButton) {
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

  getModalClassNames = () => {
    const { disableWidgetInteraction, type, widgetId } = this.props;

    return `${getAnvilWidgetDOMId(widgetId)} ${widgetTypeClassname(type)} ${
      disableWidgetInteraction ? styles.disableModalInteraction : ""
    }`;
  };

  getWidgetView() {
    const closeText = this.props.cancelButtonText || "Cancel";

    const submitText = this.props.showSubmitButton
      ? this.props.submitButtonText || "Submit"
      : undefined;
    const modalClassNames = `${this.getModalClassNames()}`;

    return (
      <Modal
        isOpen={this.state.isVisible as boolean}
        onClose={this.onModalClose}
        overlayProps={{
          [AnvilDataAttributes.MODAL_SIZE]: this.props.size,
          [AnvilDataAttributes.WIDGET_NAME]: this.props.widgetName,
          [AnvilDataAttributes.IS_SELECTED_WIDGET]: this.props.isWidgetSelected
            ? "true"
            : "false",
        }}
        setOpen={(val) => this.setState({ isVisible: val })}
        size={this.props.size}
      >
        {this.state.isVisible && (
          <ModalContent className={modalClassNames.trim()}>
            {this.props.showHeader && (
              <ModalHeader
                excludeFromTabOrder={this.props.disableWidgetInteraction}
                title={this.props.title}
              />
            )}
            <ModalBody className={WDS_MODAL_WIDGET_CLASSNAME}>
              <ModalLayoutProvider {...this.props} />
            </ModalBody>
            {this.props.showFooter && (
              <ModalFooter
                closeOnSubmit={this.props.closeOnSubmit}
                closeText={closeText}
                excludeFromTabOrder={this.props.disableWidgetInteraction}
                onSubmit={submitText ? this.onSubmitClick : undefined}
                submitText={submitText}
              />
            )}
          </ModalContent>
        )}
      </Modal>
    );
  }
}

export { WDSModalWidget };
