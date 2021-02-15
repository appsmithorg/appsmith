import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  TriggerPropertiesMap,
  DerivedPropertiesMap,
} from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta, { WithMeta } from "./MetaHOC";

const RichTextEditorComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackChunkName: "rte",webpackPrefetch: 2 */ "components/designSystems/appsmith/RichTextEditorComponent"
    ),
  ),
);

class RichTextEditorWidget extends BaseWidget<
  RichTextEditorWidgetProps,
  WidgetState
> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      value: VALIDATION_TYPES.TEXT,
      html: VALIDATION_TYPES.TEXT,
      placeholder: VALIDATION_TYPES.TEXT,
      defaultValue: VALIDATION_TYPES.TEXT,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      // onTextChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onTextChange: true,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
      html: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      value: "defaultText",
      html: "defaultHtml",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      text: `{{this.html ? this.html : this.value}}`,
    };
  }

  onValueChange = (text: string) => {
    this.props.updateWidgetMetaProperty("text", text, {
      dynamicString: this.props.onTextChange,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getPageView() {
    const defaultValue =
      (this.props.html
        ? this.props.html
        : this.props.value?.replace(/\n/g, "<br/>")) || "";
    return (
      <Suspense fallback={<Skeleton />}>
        <RichTextEditorComponent
          onValueChange={this.onValueChange}
          defaultValue={defaultValue}
          widgetId={this.props.widgetId}
          placeholder={this.props.placeholder}
          key={this.props.widgetId}
          isDisabled={this.props.isDisabled}
          isVisible={this.props.isVisible}
        />
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return "RICH_TEXT_EDITOR_WIDGET";
  }
}

export interface RichTextEditorWidgetProps extends WidgetProps, WithMeta {
  defaultText?: string;
  value?: string;
  html?: string;
  text: string;
  placeholder?: string;
  onTextChange?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
}

export default RichTextEditorWidget;
export const ProfiledRichTextEditorWidget = Sentry.withProfiler(
  withMeta(RichTextEditorWidget),
);
