import React, { useMemo } from "react";
import { Icon } from "design-system";
import history from "utils/history";
import { integrationEditorURL } from "RouteBuilder";
import { INTEGRATION_TABS } from "constants/routes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { useParams } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  createMessage,
  DATASOURCE_DROPDOWN_OPTIONS,
} from "@appsmith/constants/messages";

interface OtherOptionsProps {
  sampleData: string;
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void;
  widget: WidgetProps;
  propertyName: string;
  canWriteSchema: boolean;
}

function useOtherOptions(props: OtherOptionsProps) {
  const { pageId: currentPageId } = useParams<ExplorerURLParams>();
  const {
    addBinding,
    canWriteSchema,
    propertyName,
    sampleData,
    updateConfig,
    widget,
  } = props;
  const otherOptions = useMemo(() => {
    const options = [
      {
        icon: <Icon name="plus" size="md" />,
        id: "Connect new datasource",
        label: "Connect new datasource",
        value: "Connect new datasource",
        onSelect: () => {
          history.push(
            integrationEditorURL({
              pageId: currentPageId,
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
      },
    ];

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
    if (canWriteSchema) {
      options.push({
        icon: <Icon name="code" size="md" />,
        id: "writeJsonSchema",
        label: createMessage(DATASOURCE_DROPDOWN_OPTIONS.WRITE_JSON_SCHEMA),
        value: "writeJsonSchema",
        onSelect: () => {
          addBinding("{}", true);

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
  }, [
    currentPageId,
    sampleData,
    addBinding,
    updateConfig,
    widget,
    propertyName,
  ]);

  return otherOptions;
}

export default useOtherOptions;
