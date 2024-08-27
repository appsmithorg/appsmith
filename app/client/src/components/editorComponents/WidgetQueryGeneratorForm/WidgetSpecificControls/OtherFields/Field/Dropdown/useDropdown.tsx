import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Option } from "@appsmith/ads";
import { DropdownOption } from "../../../../CommonControls/DatasourceDropdown/DropdownOption";
import { WidgetQueryGeneratorFormContext } from "../../../../index";
import { useColumns } from "../../../ColumnDropdown/useColumns";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { get } from "lodash";
import { useSelector } from "react-redux";
import { getCurrentPageWidgets } from "ee/selectors/entitiesSelector";
import { StyledImage } from "./styles";
import { FieldOptionsType } from "./types";
import type { DropdownOptionType } from "../../../../types";
import WidgetFactory from "WidgetProvider/factory";

import {
  createMessage,
  NO_CONNECTABLE_WIDGET_FOUND,
} from "ee/constants/messages";
import type { AppState } from "ee/reducers";
import { getWidget } from "sagas/selectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export interface OneClickDropdownFieldProps {
  label: string;
  name: string;
  options: DropdownOptionType[];
  optionType: string;
  id: string;
  defaultValue?: string;
  isDataIdentifier?: boolean;
  allowClear?: boolean;
}

/* useDropdown hook - this hook is specific to one click binding control and handles all the logic for the dropdown
 * This hook is used to get the options for the dropdown based on the optionType provided by the widget's control config
 * The options are fetched from the following sources:
 * 1. Custom options - options provided by the user in the widget's control config
 * 2. Columns - options fetched from the columns of the selected datasource
 * 3. Widgets - options fetched from the connectable widgets present on the page
 * The selected option is then stored in the widget's config with the key "otherFields.<fieldName>"
 *  */
export function useDropdown(props: OneClickDropdownFieldProps) {
  const {
    defaultValue,
    label,
    name,
    options: fieldOptions,
    optionType,
  } = props;
  const [message, setMessage] = useState("");
  const currentPageWidgets = useSelector(getCurrentPageWidgets);
  const { config, propertyName, updateConfig, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );
  const widget = useSelector((state: AppState) => getWidget(state, widgetId));
  const { disabled, options: columns } = useColumns("", false);

  const configName = `otherFields.${name}`;

  useEffect(() => {
    updateDefaultValue();
  }, [defaultValue]);

  const updateDefaultValue = useCallback(() => {
    if (defaultValue) {
      updateConfig(configName, defaultValue);
    }
  }, [name, defaultValue]);

  const widgetOptions: DropdownOptionType[] = Object.entries(currentPageWidgets)
    .map(([currWidgetId, currWidget]) => {
      const { getOneClickBindingConnectableWidgetConfig } =
        WidgetFactory.getWidgetMethods(currWidget.type);
      if (getOneClickBindingConnectableWidgetConfig) {
        const { message, widgetBindPath } =
          getOneClickBindingConnectableWidgetConfig(currWidget);
        return {
          id: currWidgetId,
          value: widgetBindPath,
          label: currWidget.widgetName,
          icon: <StyledImage alt="widget-icon" src={currWidget.iconSVG} />,
          data: {
            widgetType: currWidget.type,
            widgetName: currWidget.widgetName,
          },
          message,
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any) => d.id === selectedOption.key,
    );
    if (option) {
      onSelect(value);
      if (option.message) {
        setMessage(option.message);
      }
      AnalyticsUtil.logEvent("ONE_CLICK_BINDING_CONFIG", {
        widgetName: widget.widgetName,
        widgetType: widget.type,
        propertyName,
        dataTableName: config.table,
        sheetName: config.sheet,
        formType: name === "formType" ? option.value : "",
        pluginType: config.datasourcePluginType,
        pluginName: config.datasourcePluginName,
        ...(option.data && {
          connectedWidgetType: option.data.widgetType,
          connectedWidgetName: option.data.widgetName,
        }),
        ...(name === "dataIdentifier" && {
          dataIdentifierColumn: option.value,
        }),
      });
    }
  };

  const selectedValue = get(config, configName);

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
    selected,
    disabled,
    message,
  };
}
