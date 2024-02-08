import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button, Icon } from "design-system";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "pages/Editor/CustomWidgetBuilder/constants";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";
import CustomWidgetBuilderService from "utils/CustomWidgetBuilderService";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface ButtonControlState {
  isSourceEditorOpen: boolean;
}

const StyledButton = styled(Button)`
  width: 100%;
`;

class ButtonControl extends BaseControl<ControlProps, ButtonControlState> {
  state: ButtonControlState = {
    isSourceEditorOpen: false,
  };

  getPayload = () => {
    return {
      name: this.props.widgetProperties.widgetName,
      widgetId: this.props.widgetProperties.widgetId,
      srcDoc: this.props.widgetProperties.srcDoc,
      uncompiledSrcDoc: this.props.widgetProperties.uncompiledSrcDoc,
      model:
        this.props.widgetProperties.__evaluation__?.evaluatedValues
          ?.defaultModel,
      events: this.props.widgetProperties.events.reduce(
        (prev: Record<string, string>, curr: string) => {
          prev[curr] = this.props.widgetProperties[curr];

          return prev;
        },
        {},
      ),
      theme: this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme,
    };
  };

  onCTAClick = () => {
    AnalyticsUtil.logEvent("CUSTOM_WIDGET_EDIT_SOURCE_CLICKED", {
      widgetId: this.props.widgetProperties.widgetId,
    });

    if (
      CustomWidgetBuilderService.isConnected(
        this.props.widgetProperties.widgetId,
      )
    ) {
      CustomWidgetBuilderService.focus(this.props.widgetProperties.widgetId);
    } else {
      const { onMessage, postMessage } =
        CustomWidgetBuilderService.createConnection(
          this.props.widgetProperties.widgetId,
        );

      onMessage(CUSTOM_WIDGET_BUILDER_EVENTS.READY, () => {
        postMessage({
          type: CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK,
          ...this.getPayload(),
        });
      });

      onMessage(CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC, (data: any) => {
        this.props.onBatchUpdateProperties?.({
          srcDoc: data.srcDoc,
          uncompiledSrcDoc: data.uncompiledSrcDoc,
        });

        postMessage({
          type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC_ACK,
          success: true,
        });
      });

      onMessage(CUSTOM_WIDGET_BUILDER_EVENTS.DISCONNECTED, () => {
        CustomWidgetBuilderService.closeConnection(
          this.props.widgetProperties.widgetId,
          true,
        );

        this.setState({
          isSourceEditorOpen: false,
        });
      });

      this.setState({
        isSourceEditorOpen: true,
      });
    }
  };

  beforeWindowUnload = () => {
    CustomWidgetBuilderService.closeConnection(
      this.props.widgetProperties.widgetId,
    );
  };

  componentDidMount(): void {
    window.addEventListener("beforeunload", this.beforeWindowUnload);

    if (
      CustomWidgetBuilderService.isConnected(
        this.props.widgetProperties.widgetId,
      )
    ) {
      CustomWidgetBuilderService.getConnection(
        this.props.widgetProperties.widgetId,
      )?.postMessage({
        type: CUSTOM_WIDGET_BUILDER_EVENTS.RESUME,
        ...this.getPayload(),
      });
    }
  }

  componentWillUnmount(): void {
    CustomWidgetBuilderService.getConnection(
      this.props.widgetProperties.widgetId,
    )?.postMessage({
      type: CUSTOM_WIDGET_BUILDER_EVENTS.PAUSE,
    });

    window.removeEventListener("beforeunload", this.beforeWindowUnload);
  }

  componentDidUpdate(prevProps: Readonly<ControlProps>): void {
    const hasEventChanged =
      this.props.widgetProperties.events.length !==
        prevProps.widgetProperties.events.length ||
      this.props.widgetProperties.events.some((event: string) => {
        return (
          prevProps.widgetProperties[event] !==
          this.props.widgetProperties[event]
        );
      });

    if (
      CustomWidgetBuilderService.isConnected(
        this.props.widgetProperties.widgetId,
      ) &&
      (prevProps.widgetProperties.widgetName !==
        this.props.widgetProperties.widgetName ||
        hasEventChanged ||
        prevProps.widgetProperties.__evaluation__?.evaluatedValues
          ?.defaultModel !==
          this.props.widgetProperties.__evaluation__?.evaluatedValues
            ?.defaultModel ||
        this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme !==
          this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme)
    ) {
      const connection = CustomWidgetBuilderService.getConnection(
        this.props.widgetProperties.widgetId,
      );

      connection?.postMessage({
        type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERENCES,
        name: this.props.widgetProperties.widgetName,
        model:
          this.props.widgetProperties.__evaluation__?.evaluatedValues
            ?.defaultModel,
        events: this.props.widgetProperties.events.reduce(
          (prev: Record<string, string>, curr: string) => {
            prev[curr] = this.props.widgetProperties[curr];

            return prev;
          },
          {},
        ),
        theme:
          this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme,
      });
    }
  }

  render() {
    return (
      <StyledButton
        className="t--edit-custom-widget-source"
        kind="secondary"
        onClick={this.onCTAClick}
        size="md"
      >
        {this.state.isSourceEditorOpen ||
        CustomWidgetBuilderService.isConnected(
          this.props.widgetProperties.widgetId,
        )
          ? createMessage(CUSTOM_WIDGET_FEATURE.editSource.goToSourceCTA)
          : createMessage(CUSTOM_WIDGET_FEATURE.editSource.editSourceCTA)}
        &nbsp;
        <Icon name="share-box-line" size="sm" />
      </StyledButton>
    );
  }

  static getControlType() {
    return "CUSTOM_WIDGET_EDIT_BUTTON_CONTROL";
  }
}

export default ButtonControl;
