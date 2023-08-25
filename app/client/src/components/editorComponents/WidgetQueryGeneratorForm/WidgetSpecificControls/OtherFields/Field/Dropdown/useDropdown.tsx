import React, { useCallback, useContext, useMemo } from "react";
import { Option } from "design-system";
import { DropdownOption } from "../../../../CommonControls/DatasourceDropdown/DropdownOption";
import { WidgetQueryGeneratorFormContext } from "../../../../index";
import { useColumns } from "../../../ColumnDropdown/useColumns";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getAllPageWidgets } from "../../../../../../../selectors/entitiesSelector";
import { StyledImage } from "./styles";
import { FieldOptionsType } from "./types";
import type { DropdownOptionType } from "../../../../types";

export type OneClickDropdownFieldProps = {
  label: string;
  name: string;
  options: DropdownOptionType[];
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

  const configName = `otherFields.${name}`;

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
