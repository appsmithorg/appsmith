import React, { useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";
import type { AppState } from "ee/reducers";
import {
  createMessage,
  DATASOURCE_DROPDOWN_OPTIONS,
} from "ee/constants/messages";
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
  if (variant === DROPDOWN_VARIANT.CREATE_OR_EDIT_RECORDS) {
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

/*
 * One click binding's sourceData control lets you connect to
 * 1. Datasource
 * 2. Query
 * 3. Sample data
 * 4. Widget
 *
 * And this hook returns the dropdown options for the same. Takes searchText as input to filter.
 *  */
export function useSource(searchText: string) {
  const {
    config,
    datasourceDropdownVariant,
    errorMsg,
    isSourceOpen,
    onSourceClose,
    propertyValue,
    sampleData,
    widgetId,
  } = useContext(WidgetQueryGeneratorFormContext);

  const pluginImages = useSelector(getPluginImages);

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const constants = getDropdownConstants(datasourceDropdownVariant);

  const { datasourceOptions } = useDatasourceOptions({
    pluginImages,
    widget,
  });

  const { queryOptions, widgetOptions } = useConnectToOptions({
    pluginImages,
    widget,
  });

  const otherOptions = useOtherOptions({
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

  const error = useMemo(() => {
    if (config.datasource) {
      return "";
    }

    // DROPDOWN_VARIANT.CONNECT_TO_QUERY acts like query selector for us (we use it in AI widget)
    // so we need to check if the selected query exists in the queryOptions
    // if it does not exist, we need to show error that the query is not found
    if (
      datasourceDropdownVariant === DROPDOWN_VARIANT.CONNECT_TO_QUERY &&
      propertyValue
    ) {
      const selectedQuery = queryOptions.find(
        (option) => option.value === propertyValue,
      );

      if (!selectedQuery) {
        return `Chat query is required`;
      }
    }

    return errorMsg;
  }, [config.datasource, errorMsg, queryOptions, propertyValue]);

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
    error: error,
    disabled: isConnecting,
  };
}

export default useSource;
