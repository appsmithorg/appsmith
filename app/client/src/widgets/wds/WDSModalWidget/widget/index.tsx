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
import styled from "styled-components";

const StyledModalBody = styled.div`
  & > div {
    min-height: var(--sizing-16);
    max-height: calc(
      var(--canvas-height) - var(--outer-spacing-4) - var(--outer-spacing-4) - var(
          --outer-spacing-4
        ) - 100px
    );
    overflow-y: auto;
  }
`;

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
        style={{
          width: `calc(var(--provider-width) - var(--sizing-6))`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ModalContent className={this.props.className}>
          {this.props.showHeader && <ModalHeader title={this.props.title} />}
          <StyledModalBody className="appsmith-modal-body">
            <LayoutProvider {...this.props} />
          </StyledModalBody>
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
