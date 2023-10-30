import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

import IconSVG from "../icon.svg";
import type { BaseInputWidgetProps } from "./types";
import { propertyPaneContentConfig } from "./contentConfig";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type {
  AnvilConfig,
  WidgetBaseConfiguration,
} from "WidgetProvider/constants";

class WDSBaseInputWidget<
  T extends BaseInputWidgetProps,
  K extends WidgetState,
> extends BaseWidget<T, K> {
  constructor(props: T) {
    super(props);
  }

  static getConfig(): WidgetBaseConfiguration {
    return {
      name: "Input",
      hideCard: true,
      iconSVG: IconSVG,
      needsMeta: true,
    };
  }

  static getDefaults() {
    return {
      rows: 4,
      label: "Label",
      labelPosition: "side",
      labelAlignment: "left",
      labelTextSize: "0.875rem",
      labelWidth: 5,
      columns: 20,
      widgetName: "Input",
      version: 1,
      defaultText: "",
      iconAlign: "left",
      autoFocus: false,
      labelStyle: "",
      resetOnSubmit: true,
      isRequired: false,
      isDisabled: false,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.text}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      text: "defaultText",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
      isFocused: false,
      isDirty: false,
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "70px" },
        minWidth: { base: "120px" },
      },
    };
  }

  /**
   * disabled drag on focusState: true
   *
   * Reason:
   * 1. In Firefox, draggable="true" property on the parent element
   *    or <input /> itself, interferes with some <input /> element's events
   *    Bug Ref - https://bugzilla.mozilla.org/show_bug.cgi?id=800050
   *              https://bugzilla.mozilla.org/show_bug.cgi?id=1189486*
   *    Eg - input with draggable="true", double clicking the text; won't highlight the text
   *
   * 2. Dragging across the text (for text selection) in input won't cause the widget to drag.
   */
  onFocusChange(focusState: boolean) {
    this.props.updateWidgetMetaProperty("dragDisabled", focusState);
  }

  resetWidgetText() {
    this.props.updateWidgetMetaProperty("text", "");
  }

  onSubmitSuccess = (result: ExecutionResult) => {
    if (result.success && this.props.resetOnSubmit) {
      super.resetChildrenMetaProperty(this.props.widgetId);

      this.resetWidgetText();
    }
  };

  onKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
    isMultiLine = false,
  ) {
    const isTextArea = isMultiLine;
    const { isValid, onSubmit } = this.props;
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    const hasOnSubmit = typeof onSubmit === "string" && onSubmit;

    if (
      hasOnSubmit &&
      isEnterKey &&
      // If the user presses {enter} with command/ctrl key in a textarea, trigger the onSubmit action
      // or If the user presses {enter} in a text input, trigger the onSubmit action if the input is valid
      ((isTextArea && (e.metaKey || e.ctrlKey)) || (!isTextArea && isValid))
    ) {
      // Originally super.executeAction was used to trigger the ON_SUBMIT action and updateMetaProperty
      // to update the text. Since executeAction is not queued and updateMetaProperty is, the user
      // would observe that the data tree only gets partially updated with text before the ON_SUBMIT
      // would get triggered, if they type {enter} really fast after typing some input text. So we're
      // using updateMetaProperty to trigger the ON_SUBMIT to let the data tree update before we
      // actually execute the action. Since updateMetaProperty expects a meta property to be updated,
      // we are redundantly updating the common meta property, isDirty which is common on its child widgets
      // here. But the main part is the action execution payload.
      this.props.updateWidgetMetaProperty("isDirty", this.props.isDirty, {
        triggerPropertyName: "onSubmit",
        dynamicString: onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: this.onSubmitSuccess,
        },
      });
    }
  }

  getWidgetView() {
    //
  }

  static getWidgetType(): WidgetType {
    return "WDS_BASE_INPUT_WIDGET";
  }
}

export { WDSBaseInputWidget };
