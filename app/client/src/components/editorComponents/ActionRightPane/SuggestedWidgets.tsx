import React, { memo, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { Collapsible } from ".";
import { getTypographyByKey } from "design-system-old";
import { addSuggestedWidget } from "actions/widgetActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  ADD_NEW_WIDGET,
  ADD_NEW_WIDGET_SUB_HEADING,
  BINDING_SECTION_LABEL,
  CONNECT_EXISTING_WIDGET_LABEL,
  CONNECT_EXISTING_WIDGET_SUB_HEADING,
  createMessage,
  NO_EXISTING_WIDGETS,
  SUGGESTED_WIDGETS,
  SUGGESTED_WIDGET_TOOLTIP,
  BINDING_WALKTHROUGH_TITLE,
  BINDING_WALKTHROUGH_DESC,
} from "@appsmith/constants/messages";
import type { SuggestedWidget } from "api/ActionAPI";

import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgets } from "sagas/selectors";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { Tooltip } from "design-system";
// import chartWidgetIcon from "./../../../widgets/ChartWidget/icon.svg";
import { Text } from "design-system";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlagCheck } from "selectors/featureFlagsSelectors";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsStructureReducer";
import { useParams } from "react-router";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { bindDataToWidget } from "actions/propertyPaneActions";
import tableWidgetIconSvg from "../../../widgets/TableWidgetV2/icon.svg";
import selectWidgetIconSvg from "../../../widgets/SelectWidget/icon.svg";
import chartWidgetIconSvg from "../../../widgets/ChartWidget/icon.svg";
import inputWidgetIconSvg from "../../../widgets/InputWidgetV2/icon.svg";
import textWidgetIconSvg from "../../../widgets/TextWidget/icon.svg";
import listWidgetIconSvg from "../../../widgets/ListWidget/icon.svg";
import FeatureFlagWalkthroughUtils from "utils/FeatureFlagWalkthroughUtils";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";

const BINDING_GUIDE_GIF =
  "https://myawsbucketdip.s3.ap-southeast-1.amazonaws.com/schema.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230630T081156Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86400&X-Amz-Credential=AKIAYOEVYR6QX442SDWZ%2F20230630%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Signature=678096bd94148a5711252a9fe90b90826ac88ce146eb07586498f7f109c5a17a";

const BINDING_SECTION_ID = "t--api-right-pane-binding";

const WidgetList = styled.div`
  ${getTypographyByKey("p1")}
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;

  img {
    max-width: 100%;
    border-radius: var(--ads-v2-border-radius);
  }

  .image-wrapper {
    position: relative;
    margin-top: ${(props) => props.theme.spaces[1]}px;
    display: flex;
    flex-direction: column;
  }

  .widget:hover {
    cursor: pointer;
  }

  .widget:not(:first-child) {
    margin-top: 24px;
  }
`;

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;

  .widget-name {
    padding-left: 8px;
  }

  img {
    height: 16px;
    width: 16px;
  }
`;

const SubSection = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const HeadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;
  padding-bottom: 4px;
`;

type WidgetBindingInfo = {
  label: string;
  propertyName: string;
  widgetName: string;
  image?: string;
  icon?: string;
};

export const WIDGET_DATA_FIELD_MAP: Record<string, WidgetBindingInfo> = {
  LIST_WIDGET: {
    label: "items",
    propertyName: "listData",
    widgetName: "List",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/list.svg`,
    icon: listWidgetIconSvg,
  },
  TABLE_WIDGET: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/table.svg`,
    icon: tableWidgetIconSvg,
  },
  TABLE_WIDGET_V2: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/table.svg`,
    icon: tableWidgetIconSvg,
  },
  CHART_WIDGET: {
    label: "chart-series-data-control",
    propertyName: "chartData",
    widgetName: "Chart",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/chart.svg`,
    icon: chartWidgetIconSvg,
  },
  SELECT_WIDGET: {
    label: "options",
    propertyName: "options",
    widgetName: "Select",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/dropdown.svg`,
    icon: selectWidgetIconSvg,
  },
  TEXT_WIDGET: {
    label: "text",
    propertyName: "text",
    widgetName: "Text",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/text.svg`,
    icon: textWidgetIconSvg,
  },
  INPUT_WIDGET_V2: {
    label: "text",
    propertyName: "defaultText",
    widgetName: "Input",
    image: `${ASSETS_CDN_URL}/widgetSuggestion/input.svg`,
    icon: inputWidgetIconSvg,
  },
};

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
          [fieldName]: `{{${actionName}.${suggestedWidget.bindingQuery}}}`,
          defaultOptionValue: `{{
            {
              label: ${widgetName}.options[0].label,
              value: ${widgetName}.options[0].value
            }
          }}`,
          dynamicBindingPathList: [
            { key: widgetInfo.propertyName },
            { key: "defaultOptionValue" },
          ],
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

type SuggestedWidgetProps = {
  actionName: string;
  suggestedWidgets: SuggestedWidget[];
  hasWidgets: boolean;
};

function renderHeading(heading: string, subHeading: string) {
  return (
    <HeadingWrapper>
      <Text kind="heading-xs">{heading}</Text>
      <Text kind="body-s">{subHeading}</Text>
    </HeadingWrapper>
  );
}

function renderWidgetItem(icon: string | undefined, name: string | undefined) {
  return (
    <ItemWrapper>
      {icon && <img alt="widget-icon" src={icon} />}
      <Text className="widget-name">{name}</Text>
    </ItemWrapper>
  );
}

function renderWidgetImage(image: string | undefined) {
  if (!!image) {
    return <img alt="widget-info-image" src={getAssetUrl(image)} />;
  }
  return null;
}

function SuggestedWidgets(props: SuggestedWidgetProps) {
  const dispatch = useDispatch();
  const dataTree = useSelector(getDataTree);
  const canvasWidgets = useSelector(getWidgets);
  const applicationId = useSelector(getCurrentApplicationId);
  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};

  // A/B feature flag for query binding.
  const isEnabledForQueryBinding = useSelector((state) =>
    selectFeatureFlagCheck(state, FEATURE_FLAG.ab_ds_binding_enabled),
  );

  const params = useParams<{
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();

  const closeWalkthrough = () => {
    if (isWalkthroughOpened) {
      FeatureFlagWalkthroughUtils.setFeatureFlagShownStatus(
        FEATURE_FLAG.ab_ds_binding_enabled,
        true,
      );
      popFeature && popFeature();
    }
  };

  const addWidget = (
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
      props.actionName,
      widgetName,
    );

    AnalyticsUtil.logEvent("SUGGESTED_WIDGET_CLICK", {
      widget: suggestedWidget.type,
      abTestingFlagValue: isEnabledForQueryBinding,
    });

    closeWalkthrough();
    dispatch(addSuggestedWidget(payload));
  };

  const handleBindData = (widgetId: string) => {
    dispatch(
      bindDataOnCanvas({
        queryId: (params.apiId || params.queryId) as string,
        applicationId: applicationId as string,
        pageId: params.pageId,
      }),
    );

    closeWalkthrough();
    dispatch(
      bindDataToWidget({
        widgetId: widgetId,
      }),
    );
  };

  const isTableWidgetPresentOnCanvas = () => {
    const canvasWidgetLength = Object.keys(canvasWidgets).length;
    return (
      // widgetKey == 0 condition represents MainContainer
      canvasWidgetLength > 1 &&
      Object.keys(canvasWidgets).some((widgetKey: string) => {
        return (
          canvasWidgets[widgetKey]?.type === "TABLE_WIDGET_V2" &&
          parseInt(widgetKey, 0) !== 0
        );
      })
    );
  };

  const labelOld = props.hasWidgets
    ? createMessage(ADD_NEW_WIDGET)
    : createMessage(SUGGESTED_WIDGETS);
  const labelNew = createMessage(BINDING_SECTION_LABEL);
  const addNewWidgetLabel = createMessage(ADD_NEW_WIDGET);
  const addNewWidgetSubLabel = createMessage(ADD_NEW_WIDGET_SUB_HEADING);
  const connectExistingWidgetLabel = createMessage(
    CONNECT_EXISTING_WIDGET_LABEL,
  );
  const connectExistingWidgetSubLabel = createMessage(
    CONNECT_EXISTING_WIDGET_SUB_HEADING,
  );
  const isWidgetsPresentOnCanvas = Object.keys(canvasWidgets).length > 0;

  useEffect(() => {
    const isFeatureWalkthroughShown =
      FeatureFlagWalkthroughUtils.getFeatureFlagShownStatus(
        FEATURE_FLAG.ab_ds_binding_enabled,
      );

    // Adding walkthrough tutorial
    !isFeatureWalkthroughShown &&
      isEnabledForQueryBinding &&
      pushFeature &&
      pushFeature({
        targetId: BINDING_SECTION_ID,
        onDismiss: () => {
          FeatureFlagWalkthroughUtils.setFeatureFlagShownStatus(
            FEATURE_FLAG.ab_ds_schema_enabled,
            true,
          );
        },
        details: {
          title: createMessage(BINDING_WALKTHROUGH_TITLE),
          description: createMessage(BINDING_WALKTHROUGH_DESC),
          imageURL: BINDING_GUIDE_GIF,
        },
        offset: {
          position: "left",
          left: -40,
          highlightPad: 5,
          indicatorLeft: -3,
          style: {
            transform: "none",
          },
        },
      });
  }, [isEnabledForQueryBinding]);

  return (
    <section id={BINDING_SECTION_ID}>
      {!!isEnabledForQueryBinding ? (
        <Collapsible label={labelNew}>
          {isTableWidgetPresentOnCanvas() && (
            <SubSection>
              {renderHeading(
                connectExistingWidgetLabel,
                connectExistingWidgetSubLabel,
              )}
              {!isWidgetsPresentOnCanvas && (
                <Text kind="body-s">{createMessage(NO_EXISTING_WIDGETS)}</Text>
              )}

              {/* Table Widget condition is added temporarily as connect to existing 
              functionality is currently working only for Table Widget,
              in future we want to support it for all widgets */}
              {
                <WidgetList>
                  {Object.keys(canvasWidgets).map((widgetKey) => {
                    const widget: FlattenedWidgetProps | undefined =
                      canvasWidgets[widgetKey];
                    const widgetInfo: WidgetBindingInfo | undefined =
                      WIDGET_DATA_FIELD_MAP[widget.type];

                    if (!widgetInfo || widget?.type !== "TABLE_WIDGET_V2")
                      return null;

                    return (
                      <div
                        className={`widget t--suggested-widget-${widget.type}`}
                        key={widget.type + widget.widgetId}
                        onClick={() => handleBindData(widgetKey)}
                      >
                        <Tooltip
                          content={createMessage(SUGGESTED_WIDGET_TOOLTIP)}
                        >
                          <div className="image-wrapper">
                            {renderWidgetImage(widgetInfo.image)}
                            {renderWidgetItem(
                              widgetInfo.icon,
                              widget.widgetName,
                            )}
                          </div>
                        </Tooltip>
                      </div>
                    );
                  })}
                </WidgetList>
              }
            </SubSection>
          )}
          <SubSection>
            {renderHeading(addNewWidgetLabel, addNewWidgetSubLabel)}
            <WidgetList>
              {props.suggestedWidgets.map((suggestedWidget) => {
                const widgetInfo: WidgetBindingInfo | undefined =
                  WIDGET_DATA_FIELD_MAP[suggestedWidget.type];

                if (!widgetInfo) return null;

                return (
                  <div
                    className={`widget t--suggested-widget-${suggestedWidget.type}`}
                    key={suggestedWidget.type}
                    onClick={() => addWidget(suggestedWidget, widgetInfo)}
                  >
                    <Tooltip content={createMessage(SUGGESTED_WIDGET_TOOLTIP)}>
                      {renderWidgetItem(widgetInfo.icon, widgetInfo.widgetName)}
                    </Tooltip>
                  </div>
                );
              })}
            </WidgetList>
          </SubSection>
        </Collapsible>
      ) : (
        <Collapsible label={labelOld}>
          <WidgetList>
            {props.suggestedWidgets.map((suggestedWidget) => {
              const widgetInfo: WidgetBindingInfo | undefined =
                WIDGET_DATA_FIELD_MAP[suggestedWidget.type];

              if (!widgetInfo) return null;

              return (
                <div
                  className={`widget t--suggested-widget-${suggestedWidget.type}`}
                  key={suggestedWidget.type}
                  onClick={() => addWidget(suggestedWidget, widgetInfo)}
                >
                  <Tooltip content={createMessage(SUGGESTED_WIDGET_TOOLTIP)}>
                    <div className="image-wrapper">
                      {renderWidgetImage(widgetInfo.image)}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </WidgetList>
        </Collapsible>
      )}
    </section>
  );
}

const MemoizedSuggestedWidgets = memo(SuggestedWidgets);
export default MemoizedSuggestedWidgets;
