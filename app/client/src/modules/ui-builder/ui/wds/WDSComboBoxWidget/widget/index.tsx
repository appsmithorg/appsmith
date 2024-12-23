import React from "react";
import { ComboBox, ListBoxItem } from "@appsmith/wds";
import { validateInput } from "../../WDSSelectWidget/widget/helpers";
import { ComboboxSelectIcon, ComboboxSelectThumbnail } from "appsmith-icons";

import { WDSSelectWidget } from "../../WDSSelectWidget";
import isArray from "lodash/isArray";

class WDSComboBoxWidget extends WDSSelectWidget {
  static type = "WDS_COMBOBOX_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "ComboBox",
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      widgetName: "ComboBox",
    };
  }

  static getMethods() {
    return {
      ...super.getMethods(),
      IconCmp: ComboboxSelectIcon,
      ThumbnailCmp: ComboboxSelectThumbnail,
    };
  }

  getWidgetView() {
    const { labelTooltip, placeholderText, selectedOptionValue, ...rest } =
      this.props;
    const validation = validateInput(this.props);
    const options = (isArray(this.props.options) ? this.props.options : []) as {
      value: string;
      label: string;
    }[];
    // This is key is used to force re-render of the widget when the options change.
    // Why force re-render on   options change?
    // Sometimes when the user is changing options, the select throws an error ( related to react-aria code ) saying "cannot change id of item".
    const key = options.map((option) => option.value).join(",");

    return (
      <ComboBox
        {...rest}
        contextualHelp={labelTooltip}
        errorMessage={validation.errorMessage}
        isInvalid={validation.validationStatus === "invalid"}
        key={key}
        onSelectionChange={this.handleChange}
        placeholder={placeholderText}
        selectedKey={selectedOptionValue}
      >
        {options.map((option) => (
          <ListBoxItem
            id={option.value}
            key={option.value}
            textValue={option.label}
          >
            {option.label}
          </ListBoxItem>
        ))}
      </ComboBox>
    );
  }
}

export { WDSComboBoxWidget };
