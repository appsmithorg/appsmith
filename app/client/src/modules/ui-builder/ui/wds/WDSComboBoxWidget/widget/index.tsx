import React from "react";
import { ComboBox, ListBoxItem } from "@appsmith/wds";
import { validateInput } from "../../WDSSelectWidget/widget/helpers";
import { ComboboxSelectIcon, ComboboxSelectThumbnail } from "appsmith-icons";

import { WDSSelectWidget } from "../../WDSSelectWidget";

class WDSComboBoxWidget extends WDSSelectWidget {
  static type = "WDS_COMBOBOX_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "ComboBox",
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
    const {
      labelTooltip,
      options,
      placeholderText,
      selectedOptionValue,
      ...rest
    } = this.props;

    const validation = validateInput(this.props);
    // This is key is used to force re-render of the widget when the options change.
    // Why force re-render on   options change?
    // Sometimes when the user is changing options, the select throws an error saying "cannot change id of item".
    const key = this.optionsToSelectItems(options)
      .map((option) => option.id)
      .join(",");

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
        {this.optionsToSelectItems(options).map((option) => (
          <ListBoxItem id={option.id} key={option.id} textValue={option.label}>
            {option.label}
          </ListBoxItem>
        ))}
      </ComboBox>
    );
  }
}

export { WDSComboBoxWidget };
