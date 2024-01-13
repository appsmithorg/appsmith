import React, { memo, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
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
import type { TextKind } from "design-system";
import { Text } from "design-system";
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
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import {
  getFeatureWalkthroughShown,
  isUserSignedUpFlagSet,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { getCurrentUser } from "selectors/usersSelectors";
import localStorage from "utils/localStorage";
import { WIDGET_ID_SHOW_WALKTHROUGH } from "constants/WidgetConstants";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import type { WidgetType } from "constants/WidgetConstants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import Collapsible from "components/common/Collapsible";

const BINDING_GUIDE_GIF = `${ASSETS_CDN_URL}/binding.gif`;

const BINDING_SECTION_ID = "t--api-right-pane-binding";

const WidgetList = styled.div`
  height: 100%;
  overflow: auto;
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

  &.spacing {
    .widget:not(:first-child) {
      margin-top: 16px;
    }
  }
`;

const ExistingWidgetList = styled.div`
  display: flex;
  flex-wrap: wrap;

  .image-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 110px;
    margin: 4px;
    border: 1px solid var(--ads-v2-color-gray-300);
    border-radius: var(--ads-v2-border-radius);

    &:hover {
      border: 1px solid var(--ads-v2-color-gray-600);
    }
  }

  img {
    height: 54px;
  }

  .widget:hover {
    cursor: pointer;
  }
`;

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;

  .widget-name {
    padding-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  img {
    height: 16px;
    width: 16px;
  }
`;

const SubSection = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  overflow-y: scroll;
  height: 100%;
`;

const HeadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;
  padding-bottom: 12px;
`;

const SuggestedWidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
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

//TODO(Balaji): Abstraction leak.
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

interface SuggestedWidgetProps {
  actionName: string;
  suggestedWidgets: SuggestedWidget[];
  hasWidgets: boolean;
}

function renderHeading(heading: string, subHeading: string) {
  return (
    <HeadingWrapper>
      <Text kind="heading-xs">{heading}</Text>
      <Text kind="body-s">{subHeading}</Text>
    </HeadingWrapper>
  );
}

function renderWidgetItem(
  icon: string | undefined,
  name: string | undefined,
  textKind: TextKind,
) {
  return (
    <ItemWrapper>
      {icon && <img alt="widget-icon" src={icon} />}
      <Text className="widget-name" kind={textKind}>
        {name}
      </Text>
    </ItemWrapper>
  );
}

function renderWidgetImage(image: string | undefined) {
  if (!!image) {
    return <img alt="widget-info-image" src={getAssetUrl(image)} />;
  }
  return null;
}

const SUPPORTED_SUGGESTED_WIDGETS = ["TABLE_WIDGET_V2"];

function SuggestedWidgets(props: SuggestedWidgetProps) {
  const dispatch = useDispatch();
  const dataTree = useSelector(getDataTree);
  const canvasWidgets = useSelector(getWidgets);
  const applicationId = useSelector(getCurrentApplicationId);
  const user = useSelector(getCurrentUser);
  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};

  const params = useParams<{
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();

  const closeWalkthrough = () => {
    popFeature && popFeature("BINDING_WIDGET");
    setFeatureWalkthroughShown(FEATURE_WALKTHROUGH_KEYS.ds_binding, true);
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
      props.actionName,
      widgetName,
    );

    AnalyticsUtil.logEvent("SUGGESTED_WIDGET_CLICK", {
      widget: suggestedWidget.type,
      isWalkthroughOpened,
    });

    const showStatus = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.binding_widget,
    );
    // To enable setting the widget id for showing walkthrough once the widget is created in WidgetOperationSagas.tsx -> addSuggestedWidget function
    if (!showStatus) {
      (payload.props as any).setWidgetIdForWalkthrough = "true";
    }
    if (isWalkthroughOpened) {
      closeWalkthrough();
    }
    dispatch(addSuggestedWidget(payload));
  };

  const handleBindData = async (widgetId: string, widgetType: WidgetType) => {
    dispatch(
      bindDataOnCanvas({
        queryId: (params.apiId || params.queryId) as string,
        applicationId: applicationId as string,
        pageId: params.pageId,
      }),
    );

    const value = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.binding_widget,
    );
    if (!value) {
      localStorage.setItem(WIDGET_ID_SHOW_WALKTHROUGH, widgetId);
    }

    const widgetSuggestedInfo = props.suggestedWidgets.find(
      (suggestedWidget) => suggestedWidget.type === widgetType,
    );

    dispatch(
      bindDataToWidget({
        widgetId: widgetId,
        bindingQuery: widgetSuggestedInfo?.bindingQuery,
      }),
    );

    if (isWalkthroughOpened) {
      closeWalkthrough();
    }
  };

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

  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.ds_binding,
    );

    const isNewUser = user && (await isUserSignedUpFlagSet(user.email));
    // Adding walkthrough tutorial
    isNewUser &&
      !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature({
        targetId: `#${BINDING_SECTION_ID}`,
        onDismiss: async () => {
          await setFeatureWalkthroughShown(
            FEATURE_WALKTHROUGH_KEYS.ds_binding,
            true,
          );
        },
        details: {
          title: createMessage(BINDING_WALKTHROUGH_TITLE),
          description: createMessage(BINDING_WALKTHROUGH_DESC),
          imageURL: getAssetUrl(BINDING_GUIDE_GIF),
        },
        offset: {
          position: "left",
          left: -40,
          highlightPad: 5,
          indicatorLeft: -3,
        },
        eventParams: {
          [FEATURE_WALKTHROUGH_KEYS.ds_binding]: true,
        },
        delay: 2500,
      });
  };

  useEffect(() => {
    checkAndShowWalkthrough();
  }, []);
  const isWDSEnabled = useFeatureFlag("ab_wds_enabled");
  const filteredSuggestedWidgets = isWDSEnabled
    ? props.suggestedWidgets.filter(
        (each) => !!Object.keys(WDS_V2_WIDGET_MAP).includes(each.type),
      )
    : props.suggestedWidgets;

  return (
    <SuggestedWidgetContainer id={BINDING_SECTION_ID}>
      <Collapsible label={labelNew}>
        {isTableWidgetPresentOnCanvas() && (
          <SubSection className="t--suggested-widget-existing">
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
              <ExistingWidgetList>
                {Object.keys(canvasWidgets).map((widgetKey) => {
                  const widget: FlattenedWidgetProps | undefined =
                    canvasWidgets[widgetKey];
                  const widgetInfo: WidgetBindingInfo | undefined =
                    WIDGET_DATA_FIELD_MAP[widget.type];

                  if (
                    !widgetInfo ||
                    !SUPPORTED_SUGGESTED_WIDGETS.includes(widget?.type)
                  )
                    return null;

                  return (
                    <div
                      className={`widget t--suggested-widget-${widget.type}`}
                      key={widget.type + widget.widgetId}
                      onClick={async () =>
                        handleBindData(widgetKey, widget.type)
                      }
                    >
                      <Tooltip
                        content={createMessage(SUGGESTED_WIDGET_TOOLTIP)}
                      >
                        <div className="image-wrapper">
                          {renderWidgetImage(widgetInfo.existingImage)}
                          {renderWidgetItem(
                            widgetInfo.icon,
                            widget.widgetName,
                            "body-s",
                          )}
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </ExistingWidgetList>
            }
          </SubSection>
        )}
        <SubSection className="t--suggested-widget-add-new">
          {renderHeading(addNewWidgetLabel, addNewWidgetSubLabel)}
          <WidgetList className="spacing">
            {filteredSuggestedWidgets.map((suggestedWidget) => {
              const widgetInfo: WidgetBindingInfo | undefined =
                WIDGET_DATA_FIELD_MAP[suggestedWidget.type];

              if (!widgetInfo) return null;

              return (
                <div
                  className={`widget t--suggested-widget-${suggestedWidget.type}`}
                  key={suggestedWidget.type}
                  onClick={async () => addWidget(suggestedWidget, widgetInfo)}
                >
                  <Tooltip content={createMessage(SUGGESTED_WIDGET_TOOLTIP)}>
                    {renderWidgetItem(
                      widgetInfo.icon,
                      widgetInfo.widgetName,
                      "body-m",
                    )}
                  </Tooltip>
                </div>
              );
            })}
          </WidgetList>
        </SubSection>
      </Collapsible>
      {/* <Collapsible label={labelOld}>
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
        </Collapsible> */}
    </SuggestedWidgetContainer>
  );
}

const MemoizedSuggestedWidgets = memo(SuggestedWidgets);
export default MemoizedSuggestedWidgets;
