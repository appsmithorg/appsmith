import React, { useCallback, useContext, useMemo } from "react";
import { Option } from "design-system";
import { DropdownOption } from "../../../../CommonControls/DatasourceDropdown/DropdownOption";
import { WidgetQueryGeneratorFormContext } from "../../../../index";
import { useColumns } from "../../../ColumnDropdown/useColumns";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getCurrentPageWidgets } from "selectors/entitiesSelector";
import { StyledImage } from "./styles";
import { FieldOptionsType } from "./types";
import type { DropdownOptionType } from "../../../../types";
import WidgetFactory from "utils/WidgetFactory";
import {
  createMessage,
  NO_CONNECTABLE_WIDGET_FOUND,
} from "@appsmith/constants/messages";

export type OneClickDropdownFieldProps = {
  label: string;
  name: string;
  options: DropdownOptionType[];
  optionType: string;
  id: string;
  defaultValue?: string;
  isDataIdentifier?: boolean;
  allowClear?: boolean;
};

export function useDropdown(props: OneClickDropdownFieldProps) {
  const {
    defaultValue,
    label,
    name,
    options: fieldOptions,
    optionType,
  } = props;

  const currentPageWidgets = useSelector(getCurrentPageWidgets);

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);
  const { disabled, options: columns } = useColumns("", false);

  const configName = `otherFields.${name}`;

  const widgetOptions: DropdownOptionType[] = Object.entries(currentPageWidgets)
    .map(([widgetId, widget]) => {
      const { getOneClickBindingConnectableWidgetConfig } =
        WidgetFactory.getWidgetMethods(widget.type);
      if (getOneClickBindingConnectableWidgetConfig) {
        const widgetBindPath =
          getOneClickBindingConnectableWidgetConfig(widget);
        return {
          id: widgetId,
          value: widgetBindPath,
          label: widget.widgetName,
          icon: <StyledImage alt="widget-icon" src={widget.iconSVG} />,
        };
      }
      return null;
    })
    .filter(Boolean) as DropdownOptionType[];

  const options = useMemo(() => {
    switch (optionType) {
      case FieldOptionsType.CUSTOM:
        return fieldOptions;
      case FieldOptionsType.COLUMNS:
        return columns;
      case FieldOptionsType.WIDGETS:
        return widgetOptions;
      default:
        return [];
    }
  }, [fieldOptions, columns]);

  const onSelect = (value: string) => {
    updateConfig(configName, value);
  };

  const handleClear = useCallback(() => {
    updateConfig(configName, "");
  }, [updateConfig]);

  const handleSelect = (value: string, selectedOption: DefaultOptionType) => {
    const option = (options as DropdownOptionType[]).find(
      (d: any) => d.id === selectedOption.key,
    );
    if (option) {
      onSelect(value);
    }
  };

  const selectedValue = get(config, configName);

  const getDefaultDropdownValue = useCallback(() => {
    if (name === "formType" && !selectedValue && defaultValue) {
      updateConfig("otherFields.formType", defaultValue);
    }
  }, [name, selectedValue, defaultValue]);

  const selected = useMemo(() => {
    if (selectedValue) {
      const option = (options as DropdownOptionType[]).find(
        (option) => option.value === selectedValue,
      );
      return {
        label: <DropdownOption label={option?.label} leftIcon={option?.icon} />,
        key: option?.id,
      };
    }
  }, [selectedValue, options]);

  const renderOptions = () => {
    if (options && options.length > 0) {
      return (options as DropdownOptionType[])?.map((option) => (
        <Option
          data-testId={`t--one-click-binding-column-${props.id}--column`}
          key={option.id}
          value={option.value}
        >
          <DropdownOption label={option.label} leftIcon={option.icon} />
        </Option>
      ));
    } else {
      return (
        <Option
          data-testId="t--one-click-binding-no-connectable-widget"
          disabled
        >
          {createMessage(NO_CONNECTABLE_WIDGET_FOUND)}
        </Option>
      );
    }
  };

  return {
    error: undefined,
    label,
    options,
    handleClear,
    handleSelect,
    renderOptions,
    defaultValue: getDefaultDropdownValue(),
    selected,
    disabled,
  };
}
