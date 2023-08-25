import React, { useCallback, useContext, useMemo } from "react";
import { Option } from "design-system";
import { DropdownOption } from "../../../CommonControls/DatasourceDropdown/DropdownOption";
import { WidgetQueryGeneratorFormContext } from "../../../index";
import { useColumns } from "../../ColumnDropdown/useColumns";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getAllPageWidgets } from "../../../../../../selectors/entitiesSelector";
import { StyledImage } from "./styles";

export type OneClickDropdownFieldProps = {
  label: string;
  name: string;
  options: unknown[];
  optionType: string;
  id: string;
  defaultValue?: string;
};

export function useDropdown(props: OneClickDropdownFieldProps) {
  const {
    defaultValue,
    label,
    name,
    options: fieldOptions,
    optionType,
  } = props;

  const canvasWidgets = useSelector(getAllPageWidgets);
  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);
  const { disabled, options: columns } = useColumns("", false);

  const allowedWidgetsToBind = [
    "TABLE_WIDGET_V2",
    "LIST_WIDGET_V2",
    "TABLE_WIDGET",
    "LIST_WIDGET",
  ];

  const widgetOptions = canvasWidgets
    ?.filter((widget) => {
      return allowedWidgetsToBind.includes(widget.type);
    })
    .map((widget) => {
      return {
        id: widget.widgetId,
        value: widget.widgetName,
        label: widget.widgetName,
        icon: <StyledImage alt="widget-icon" src={widget.iconSVG} />,
      };
    });

  // TODO: enums
  const options = useMemo(() => {
    switch (optionType) {
      case "CUSTOM":
        return fieldOptions;
      case "COLUMNS":
        return columns;
      case "WIDGETS":
        return widgetOptions;
      default:
        return [];
    }
  }, [fieldOptions, columns]);

  // TODO: don't repeat otherFields have it in a variable at top
  const onSelect = (value: string) => {
    updateConfig(`otherFields.${name}`, value);
  };

  const handleClear = useCallback(() => {
    updateConfig(`otherFields.${name}`, "");
  }, [updateConfig]);

  const handleSelect = (value: string, selectedOption: DefaultOptionType) => {
    const option = options?.find((d) => d.id === selectedOption.key);

    if (option) {
      onSelect(value);
    }
  };

  const selectedValue = get(config, `otherFields.${name}`);

  const getDefaultDropdownValue = useCallback(() => {
    // TODO: enums
    if (name === "formType" && !selectedValue && defaultValue) {
      updateConfig("otherFields.formType", defaultValue);
    }
  }, [name, selectedValue, defaultValue]);

  const selected = useMemo(() => {
    if (selectedValue) {
      const option = options.find((option) => option.value === selectedValue);
      return {
        label: <DropdownOption label={option?.label} leftIcon={option?.icon} />,
        key: option?.id,
      };
    }
  }, [selectedValue, options]);

  const renderOptions = () => {
    return options?.map((option) => (
      <Option
        data-testId={`t--one-click-binding-column-${props.id}--column`}
        key={option.id}
        value={option.value}
      >
        <DropdownOption label={option.label} leftIcon={option.icon} />
      </Option>
    ));
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
