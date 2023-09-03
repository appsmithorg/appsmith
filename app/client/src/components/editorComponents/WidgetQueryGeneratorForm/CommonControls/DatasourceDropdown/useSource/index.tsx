import React, { useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getPluginImages } from "selectors/entitiesSelector";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";
import {
  createMessage,
  DATASOURCE_DROPDOWN_OPTIONS,
} from "@appsmith/constants/messages";
import type { DropdownOptionType } from "../../../types";
import useDatasourceOptions from "./useDatasourceOptions";
import useConnectToOptions from "./useConnectToOptions";
import useOtherOptions from "./useOtherOptions";
import { DropdownOption } from "../DropdownOption";
import { Placeholder } from "../../../styles";
import { WidgetQueryGeneratorFormContext } from "../../../index";
import { DROPDOWN_VARIANT } from "../types";

function filterOption(option: DropdownOptionType, searchText: string) {
  return (
    option.label &&
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );
}

function getDropdownConstants(variant?: string) {
  if (variant === DROPDOWN_VARIANT.SCHEMA) {
    return {
      connectToText: createMessage(DATASOURCE_DROPDOWN_OPTIONS.CONNECT_TO),
      bindDatasourceText: createMessage(
        DATASOURCE_DROPDOWN_OPTIONS.CREATE_OR_EDIT_RECORDS,
      ),
      sourceDataPlaceholderText: createMessage(
        DATASOURCE_DROPDOWN_OPTIONS.SELECT_A_DATASOURCE,
      ),
    };
  } else {
    return {
      connectToText: createMessage(
        DATASOURCE_DROPDOWN_OPTIONS.CONNECT_TO_QUERY,
      ),
      bindDatasourceText: createMessage(
        DATASOURCE_DROPDOWN_OPTIONS.CHOOSE_DATASOURCE_TO_CONNECT,
      ),
      sourceDataPlaceholderText: createMessage(
        DATASOURCE_DROPDOWN_OPTIONS.CONNECT_DATA,
      ),
    };
  }
}

export function useSource(searchText: string) {
  const {
    addBinding,
    config,
    datasourceDropdownVariant,
    errorMsg,
    expectedType,
    isConnectableToWidget,
    isSourceOpen,
    onSourceClose,
    propertyName,
    propertyValue,
    sampleData,
    updateConfig,
    widgetId,
  } = useContext(WidgetQueryGeneratorFormContext);

  const pluginImages = useSelector(getPluginImages);

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const constants = getDropdownConstants(datasourceDropdownVariant);

  const canWriteSchema = datasourceDropdownVariant === DROPDOWN_VARIANT.SCHEMA;

  const { datasourceOptions } = useDatasourceOptions({
    config,
    pluginImages,
    propertyName,
    updateConfig,
    widget,
  });

  const { queryOptions, widgetOptions } = useConnectToOptions({
    addBinding,
    expectedType,
    isConnectableToWidget,
    pluginImages,
    propertyName,
    updateConfig,
    widget,
  });

  const otherOptions = useOtherOptions({
    addBinding,
    canWriteSchema,
    propertyName,
    sampleData,
    updateConfig,
    widget,
  });

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  useEffect(() => {
    if (isSourceOpen) {
      AnalyticsUtil.logEvent("WIDGET_CONNECT_DATA_CLICK", {
        widgetName: widget.widgetName,
        widgetType: widget.type,
      });
    }
  }, [isSourceOpen]);

  const [filteredDatasourceOptions, filteredQueryOptions] = useMemo(() => {
    return [
      datasourceOptions.filter((d) => filterOption(d, searchText)),
      queryOptions.filter((d) => filterOption(d, searchText)),
    ];
  }, [searchText, datasourceOptions, otherOptions, queryOptions]);

  const selected = useMemo(() => {
    let source;

    if (config.datasource) {
      source = datasourceOptions.find(
        (option) => option.id === config.datasource,
      );
    } else if (
      sampleData ===
      (typeof propertyValue === "string"
        ? propertyValue
        : JSON.stringify(propertyValue, null, 2))
    ) {
      source = otherOptions.find((option) => option.value === "Sample data");
    } else if (propertyValue) {
      source =
        queryOptions.find((option) => option.value === propertyValue) ||
        widgetOptions?.find((option) => option?.value === propertyValue);
    }

    if (source) {
      return (
        <DropdownOption
          label={source?.label?.replace("sample ", "")}
          leftIcon={source?.icon}
        />
      );
    } else {
      return <Placeholder>{constants?.sourceDataPlaceholderText}</Placeholder>;
    }
  }, [
    config,
    datasourceOptions,
    sampleData,
    propertyValue,
    otherOptions,
    queryOptions,
  ]);

  const connectToOptions = useMemo(() => {
    return [...widgetOptions, ...filteredQueryOptions];
  }, [filteredQueryOptions, widgetOptions]);

  return {
    constants,
    datasourceOptions: filteredDatasourceOptions,
    otherOptions,
    selected,
    queryOptions: filteredQueryOptions,
    widgetOptions,
    connectToOptions,
    isSourceOpen,
    onSourceClose,
    error: config.datasource ? "" : errorMsg,
    disabled: isConnecting,
  };
}

export default useSource;
