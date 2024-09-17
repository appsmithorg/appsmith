import React, { useCallback, useState } from "react";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Text,
  MenuSeparator,
  Flex,
} from "@appsmith/ads";
import {
  ADD_NEW_WIDGET,
  CONNECT_EXISTING_WIDGET_LABEL,
  createMessage,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getPageList,
  getPagePermissions,
} from "selectors/editorSelectors";
import type { SuggestedWidget } from "api/ActionAPI";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { getWidgets } from "sagas/selectors";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsStructureReducer";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { addSuggestedWidget } from "actions/widgetActions";
import { getDataTree } from "selectors/dataTreeSelectors";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import listWidgetIconSvg from "widgets/ListWidget/icon.svg";
import tableWidgetIconSvg from "widgets/TableWidgetV2/icon.svg";
import chartWidgetIconSvg from "widgets/ChartWidget/icon.svg";
import selectWidgetIconSvg from "widgets/SelectWidget/icon.svg";
import textWidgetIconSvg from "widgets/TextWidget/icon.svg";
import inputWidgetIconSvg from "widgets/InputWidgetV2/icon.svg";
import { generateReactKey } from "utils/generators";
import type { WidgetType } from "constants/WidgetConstants";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { bindDataToWidget } from "actions/propertyPaneActions";
import { useParams } from "react-router";
import styled from "styled-components";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

interface BindDataButtonProps {
  suggestedWidgets?: SuggestedWidget[];
  actionName: string;
  hasResponse: boolean;
}

const SUPPORTED_SUGGESTED_WIDGETS = ["TABLE_WIDGET_V2", "WDS_TABLE_WIDGET"];

const connectExistingWidgetLabel = createMessage(CONNECT_EXISTING_WIDGET_LABEL);
const addNewWidgetLabel = createMessage(ADD_NEW_WIDGET);

const WidgetIcon = styled.img`
  height: 15px;
`;

interface WidgetBindingInfo {
  label: string;
  propertyName: string;
  widgetName: string;
  image?: string;
  icon?: string;
  existingImage?: string;
}

export const WIDGET_DATA_FIELD_MAP: Record<string, WidgetBindingInfo> = {
  LIST_WIDGET: {
    label: "items",
    propertyName: "listData",
    widgetName: "List",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/list.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/list.svg`,
    icon: listWidgetIconSvg,
  },
  TABLE_WIDGET: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/table.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/existing_table.svg`,
    icon: tableWidgetIconSvg,
  },
  TABLE_WIDGET_V2: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/table.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/existing_table.svg`,
    icon: tableWidgetIconSvg,
  },
  WDS_TABLE_WIDGET: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/table.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/existing_table.svg`,
    icon: tableWidgetIconSvg,
  },
  CHART_WIDGET: {
    label: "chart-series-data-control",
    propertyName: "chartData",
    widgetName: "Chart",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/chart.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/chart.svg`,
    icon: chartWidgetIconSvg,
  },
  SELECT_WIDGET: {
    label: "options",
    propertyName: "options",
    widgetName: "Select",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/dropdown.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/dropdown.svg`,
    icon: selectWidgetIconSvg,
  },
  TEXT_WIDGET: {
    label: "text",
    propertyName: "text",
    widgetName: "Text",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/text.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/text.svg`,
    icon: textWidgetIconSvg,
  },
  INPUT_WIDGET_V2: {
    label: "text",
    propertyName: "defaultText",
    widgetName: "Input",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/input.svg`,
    existingImage: `${ASSETS_CDN_URL}/widgetSuggestion/input.svg`,
    icon: inputWidgetIconSvg,
  },
};

// This function and the above map can resolve the abstraction leaks, if the widgets themselves provide these configurations.
// We can then access them via the widget configs and avoid mentioning individual widget types
// Created an issue here: https://github.com/appsmithorg/appsmith/issues/34813
function getWidgetProps(
  suggestedWidget: SuggestedWidget,
  widgetInfo: WidgetBindingInfo,
  actionName: string,
  widgetName?: string,
) {
  const fieldName = widgetInfo.propertyName;
  switch (suggestedWidget.type) {
    case "TABLE_WIDGET":
      return {
        type: "TABLE_WIDGET",
        props: {
          [fieldName]: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
          dynamicBindingPathList: [{ key: "tableData" }],
        },
        parentRowSpace: 10,
      };
    case "TABLE_WIDGET_V2":
      return {
        type: "TABLE_WIDGET_V2",
        props: {
          [fieldName]: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
          dynamicBindingPathList: [{ key: "tableData" }],
          dynamicPropertyPathList:
            suggestedWidget.bindingQuery === "data"
              ? []
              : [{ key: "tableData" }],
        },
        parentRowSpace: 10,
      };
    case "CHART_WIDGET":
      const reactKey = generateReactKey();

      return {
        type: suggestedWidget.type,
        props: {
          [fieldName]: {
            [reactKey]: {
              seriesName: "Sales",
              data: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
            },
          },
          dynamicBindingPathList: [{ key: `chartData.${reactKey}.data` }],
        },
      };
    case "SELECT_WIDGET":
      return {
        type: suggestedWidget.type,
        props: {
          sourceData: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
          optionValue: "value",
          optionLabel: "label",
          defaultOptionValue: `{{
            {
              label: ${widgetName}.options[0].label,
              value: ${widgetName}.options[0].value
            }
          }}`,
          dynamicBindingPathList: [
            { key: "sourceData" },
            { key: "defaultOptionValue" },
          ],
          dynamicPropertyPathList: [{ key: "sourceData" }],
        },
      };
    case "TEXT_WIDGET":
      return {
        type: suggestedWidget.type,
        props: {
          [fieldName]: `{{JSON.stringify(${actionName}.${suggestedWidget.bindingQuery}, null, 2)}}`,
          dynamicBindingPathList: [{ key: widgetInfo.propertyName }],
        },
      };
    default:
      return {
        type: suggestedWidget.type,
        props: {
          [fieldName]: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
          dynamicBindingPathList: [{ key: widgetInfo.propertyName }],
        },
      };
  }
}

function renderHeading(heading: string) {
  return (
    <Flex paddingLeft="spaces-3" paddingTop="spaces-3">
      <Text kind="heading-xs">{heading}</Text>
    </Flex>
  );
}

function renderWidgetItem(icon: string | undefined, name: string | undefined) {
  return (
    <Flex alignItems="center" gap="spaces-3">
      {icon && <WidgetIcon alt="widget-icon" height="16px" src={icon} />}
      <Text className="widget-name" kind="body-m">
        {name}
      </Text>
    </Flex>
  );
}

function BindDataButton(props: BindDataButtonProps) {
  const { actionName, hasResponse, suggestedWidgets } = props;
  const dispatch = useDispatch();
  const pagePermissions = useSelector(getPagePermissions);

  const params = useParams<{
    basePageId: string;
    baseApiId?: string;
    baseQueryId?: string;
    moduleInstanceId?: string;
  }>();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canEditPage = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const canvasWidgets = useSelector(getWidgets);

  const dataTree = useSelector(getDataTree);

  const suggestedWidgetsEnabled =
    canEditPage && hasResponse && suggestedWidgets && !!suggestedWidgets.length;

  const applicationId = useSelector(getCurrentApplicationId);

  const [isWidgetSelectionOpen, setIsWidgetSelectionOpen] = useState(false);

  const pages = useSelector(getPageList);

  const isAnvilLayout = useSelector(getIsAnvilLayout);
  // The purpose of this filter is to make sure that if Anvil is enabled
  // only those widgets which have an alternative in Anvil are listed
  // for selection for adding a new suggested widget
  const filteredSuggestedWidgets =
    isAnvilLayout && suggestedWidgets
      ? suggestedWidgets.filter((each) =>
          Object.keys(WDS_V2_WIDGET_MAP).includes(each.type),
        )
      : suggestedWidgets;

  const handleOnInteraction = useCallback((open: boolean) => {
    if (!open) {
      setIsWidgetSelectionOpen(false);
      return;
    }
    setIsWidgetSelectionOpen(true);
  }, []);

  const isTableWidgetPresentOnCanvas = () => {
    const canvasWidgetLength = Object.keys(canvasWidgets).length;
    return (
      // widgetKey == 0 condition represents MainContainer
      canvasWidgetLength > 1 &&
      Object.keys(canvasWidgets).some((widgetKey: string) => {
        return (
          SUPPORTED_SUGGESTED_WIDGETS.includes(
            canvasWidgets[widgetKey]?.type,
          ) && parseInt(widgetKey, 0) !== 0
        );
      })
    );
  };

  const addWidget = async (
    suggestedWidget: SuggestedWidget,
    widgetInfo: WidgetBindingInfo,
  ) => {
    const widgetName = getNextWidgetName(
      canvasWidgets,
      suggestedWidget.type,
      dataTree,
    );
    const payload = getWidgetProps(
      suggestedWidget,
      widgetInfo,
      actionName,
      widgetName,
    );
    AnalyticsUtil.logEvent("SUGGESTED_WIDGET_CLICK", {
      widget: suggestedWidget.type,
    });
    // This action calls the Anvil Suggested widget saga
    // which transforms a legacy widget into an Anvil widget
    // For example: a request to add TABLE_WIDGET_V2, is transformed
    // to add WDS_TABLE_WIDGET
    dispatch(addSuggestedWidget(payload));
  };

  const handleBindData = async (widgetId: string, widgetType: WidgetType) => {
    if (!suggestedWidgets) {
      return;
    }
    dispatch(
      bindDataOnCanvas({
        queryId: (params.baseApiId ||
          params.baseQueryId ||
          params.moduleInstanceId) as string,
        applicationId: applicationId as string,
        basePageId: params.basePageId,
      }),
    );

    const widgetSuggestedInfo = suggestedWidgets.find(
      (suggestedWidget) => suggestedWidget.type === widgetType,
    );

    dispatch(
      bindDataToWidget({
        widgetId: widgetId,
        bindingQuery: widgetSuggestedInfo?.bindingQuery,
      }),
    );
  };

  if (!suggestedWidgetsEnabled) {
    return null;
  }

  return (
    <Menu onOpenChange={handleOnInteraction} open={isWidgetSelectionOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--bind-data"
          id={"bind-data-button"}
          kind={"secondary"}
          onClick={() => handleOnInteraction(true)}
          size="sm"
          startIcon="binding-new"
        >
          Bind Data
        </Button>
      </MenuTrigger>
      <MenuContent
        align={"end"}
        data-testId={"t--widget-selection"}
        height={pages.length <= 4 ? "fit-content" : "186px"}
        side={"top"}
        width="235px"
      >
        {isTableWidgetPresentOnCanvas() && (
          <div data-testid="t--suggested-widget-existing">
            {renderHeading(connectExistingWidgetLabel)}
            {Object.keys(canvasWidgets).map((widgetKey) => {
              const widget: FlattenedWidgetProps | undefined =
                canvasWidgets[widgetKey];
              const widgetInfo = WIDGET_DATA_FIELD_MAP[widget.type];
              if (
                !widgetInfo ||
                !SUPPORTED_SUGGESTED_WIDGETS.includes(widget?.type)
              ) {
                return null;
              }
              return (
                <MenuItem
                  className="widget"
                  data-testid={`t--suggested-widget-${widget.type}`}
                  key={widget.type + widget.widgetId}
                  onClick={async () => handleBindData(widgetKey, widget.type)}
                >
                  {renderWidgetItem(widgetInfo.icon, widget.widgetName)}
                </MenuItem>
              );
            })}
            <MenuSeparator />
          </div>
        )}

        <div data-testid="t--suggested-widget-add-new">
          {renderHeading(addNewWidgetLabel)}
          {(filteredSuggestedWidgets || []).map((suggestedWidget) => {
            const widgetInfo = WIDGET_DATA_FIELD_MAP[suggestedWidget.type];

            if (!widgetInfo) return null;
            return (
              <MenuItem
                className="widget"
                data-testid={`t--suggested-widget-${suggestedWidget.type}`}
                key={suggestedWidget.type}
                onClick={async () => addWidget(suggestedWidget, widgetInfo)}
              >
                {renderWidgetItem(widgetInfo.icon, widgetInfo.widgetName)}
              </MenuItem>
            );
          })}
        </div>
      </MenuContent>
    </Menu>
  );
}

export default BindDataButton;
