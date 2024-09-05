import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button, Icon } from "@appsmith/ads";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "pages/Editor/CustomWidgetBuilder/constants";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import CustomWidgetBuilderService from "utils/CustomWidgetBuilderService";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { xor } from "lodash";

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

  private onMessageCancelFunctions: Array<() => void> = [];

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

  registerEvents() {
    const builder = CustomWidgetBuilderService.getBuilder(
      this.props.widgetProperties.widgetId,
    );

    if (builder) {
      this.onMessageCancelFunctions.push(
        builder.onMessage(CUSTOM_WIDGET_BUILDER_EVENTS.READY, () => {
          builder.postMessage({
            type: CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK,
            ...this.getPayload(),
          });
        }),
      );

      this.onMessageCancelFunctions.push(
        builder.onMessage(
          CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data: any) => {
            this.props.onBatchUpdateProperties?.({
              srcDoc: data.srcDoc,
              uncompiledSrcDoc: data.uncompiledSrcDoc,
            });
          },
        ),
      );

      this.onMessageCancelFunctions.push(
        builder.onMessage(CUSTOM_WIDGET_BUILDER_EVENTS.DISCONNECTED, () => {
          CustomWidgetBuilderService.closeBuilder(
            this.props.widgetProperties.widgetId,
            false,
          );

          this.setState({
            isSourceEditorOpen: false,
          });

          this.dispostEvents();
        }),
      );
    }
  }

  dispostEvents() {
    this.onMessageCancelFunctions.forEach((fn) => fn());
    this.onMessageCancelFunctions = [];
  }

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
      CustomWidgetBuilderService.createBuilder(
        this.props.widgetProperties.widgetId,
      );

      this.registerEvents();

      this.setState({
        isSourceEditorOpen: true,
      });
    }
  };

  beforeWindowUnload = () => {
    CustomWidgetBuilderService.closeBuilder(
      this.props.widgetProperties.widgetId,
      true,
    );
  };

  componentDidMount(): void {
    window.addEventListener("beforeunload", this.beforeWindowUnload);

    if (
      CustomWidgetBuilderService.isConnected(
        this.props.widgetProperties.widgetId,
      )
    ) {
      CustomWidgetBuilderService.getBuilder(
        this.props.widgetProperties.widgetId,
      )?.postMessage({
        type: CUSTOM_WIDGET_BUILDER_EVENTS.RESUME,
        ...this.getPayload(),
      });

      this.registerEvents();
    }
  }

  componentWillUnmount(): void {
    CustomWidgetBuilderService.getBuilder(
      this.props.widgetProperties.widgetId,
    )?.postMessage({
      type: CUSTOM_WIDGET_BUILDER_EVENTS.PAUSE,
    });

    this.dispostEvents();

    window.removeEventListener("beforeunload", this.beforeWindowUnload);
  }

  componentDidUpdate(prevProps: Readonly<ControlProps>): void {
    if (
      CustomWidgetBuilderService.isConnected(
        this.props.widgetProperties.widgetId,
      )
    ) {
      /*
       * Value is true if an event is added, removed or renamed
       */
      const hasEventLengthChanged =
        xor(
          this.props.widgetProperties.events,
          prevProps.widgetProperties.events,
        )?.length !== 0;

      /*
       * Value is true if an event binding is changed
       */
      const hasEventExpressionChanged = this.props.widgetProperties.events.some(
        (event: string) => {
          return (
            prevProps.widgetProperties[event] !==
            this.props.widgetProperties[event]
          );
        },
      );

      const hasEventChanged =
        hasEventLengthChanged || hasEventExpressionChanged;

      const hasWidgetNameChanged =
        prevProps.widgetProperties.widgetName !==
        this.props.widgetProperties.widgetName;

      const hasDefaultModelChanged =
        prevProps.widgetProperties.__evaluation__?.evaluatedValues
          ?.defaultModel !==
        this.props.widgetProperties.__evaluation__?.evaluatedValues
          ?.defaultModel;

      const hasThemeChanged =
        this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme !==
        this.props.widgetProperties.__evaluation__?.evaluatedValues?.theme;

      if (
        hasWidgetNameChanged ||
        hasEventChanged ||
        hasDefaultModelChanged ||
        hasThemeChanged
      ) {
        const builder = CustomWidgetBuilderService.getBuilder(
          this.props.widgetProperties.widgetId,
        );

        builder?.postMessage({
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
