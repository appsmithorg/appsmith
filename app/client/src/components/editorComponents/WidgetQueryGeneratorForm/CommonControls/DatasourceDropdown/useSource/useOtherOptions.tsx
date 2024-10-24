import React, { useContext, useMemo } from "react";
import { Icon } from "@appsmith/ads";
import history from "utils/history";
import { integrationEditorURL } from "ee/RouteBuilder";
import { INTEGRATION_TABS } from "constants/routes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { useParams } from "react-router";
import type { ExplorerURLParams } from "ee/pages/Editor/Explorer/helpers";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  createMessage,
  DATASOURCE_DROPDOWN_OPTIONS,
} from "ee/constants/messages";
import { DROPDOWN_VARIANT } from "components/editorComponents/WidgetQueryGeneratorForm/CommonControls/DatasourceDropdown/types";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm/index";

interface OtherOptionsProps {
  widget: WidgetProps;
}

/*
 *  useOtherOptions hook - this returns dropdown options to connect to a new datasource,sample data or write json schema etc.
 * */
function useOtherOptions(props: OtherOptionsProps) {
  const {
    addBinding,
    datasourceDropdownVariant,
    propertyName,
    sampleData,
    updateConfig,
  } = useContext(WidgetQueryGeneratorFormContext);
  const { basePageId } = useParams<ExplorerURLParams>();
  const isAddBindingAllowed =
    datasourceDropdownVariant === DROPDOWN_VARIANT.CREATE_OR_EDIT_RECORDS;
  const { widget } = props;
  const otherOptions = useMemo(() => {
    // we don't want to show the options for connect to query variant
    if (datasourceDropdownVariant === DROPDOWN_VARIANT.CONNECT_TO_QUERY)
      return [];

    const options = [];

    options.push({
      icon: <Icon name="plus" size="md" />,
      id: "Connect new datasource",
      label: "Connect new datasource",
      value: "Connect new datasource",
      onSelect: () => {
        history.push(
          integrationEditorURL({
            basePageId,
            selectedTab: INTEGRATION_TABS.NEW,
          }),
        );

        AnalyticsUtil.logEvent("BIND_OTHER_ACTIONS", {
          widgetName: widget.widgetName,
          widgetType: widget.type,
          propertyName: propertyName,
          selectedAction: "Connect new datasource",
        });

        const entryPoint = DatasourceCreateEntryPoints.ONE_CLICK_BINDING;

        AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
          entryPoint,
        });
      },
    });

    if (sampleData) {
      options.push({
        icon: <Icon name="code" size="md" />,
        id: "Sample data",
        label: "Sample data",
        value: "Sample data",
        onSelect: () => {
          addBinding(sampleData, false);

          updateConfig({
            datasource: "",
            datasourcePluginType: "",
            datasourcePluginName: "",
            datasourceConnectionMode: "",
          });

          AnalyticsUtil.logEvent("BIND_OTHER_ACTIONS", {
            widgetName: widget.widgetName,
            widgetType: widget.type,
            propertyName: propertyName,
            selectedAction: "Sample data",
          });
        },
      });
    }

    if (isAddBindingAllowed) {
      options.push({
        icon: <Icon name="code" size="md" />,
        id: "writeJsonSchema",
        label: createMessage(DATASOURCE_DROPDOWN_OPTIONS.WRITE_JSON_SCHEMA),
        value: "writeJsonSchema",
        onSelect: () => {
          addBinding("", true);

          updateConfig({
            datasource: "",
            datasourcePluginType: "",
            datasourcePluginName: "",
            datasourceConnectionMode: "",
          });

          AnalyticsUtil.logEvent("BIND_OTHER_ACTIONS", {
            widgetName: widget.widgetName,
            widgetType: widget.type,
            propertyName: propertyName,
            selectedAction: "Write JSON Schema",
          });
        },
      });
    }

    return options;
  }, [basePageId, sampleData, addBinding, updateConfig, widget, propertyName]);

  return otherOptions;
}

export default useOtherOptions;
