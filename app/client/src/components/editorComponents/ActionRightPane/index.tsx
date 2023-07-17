import React, { useContext, useMemo } from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import { Classes, getTypographyByKey } from "design-system-old";
import { Button, Divider, Icon, Link, Text } from "design-system";
import { useState } from "react";
import Connections from "./Connections";
import SuggestedWidgets from "./SuggestedWidgets";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { AppState } from "@appsmith/reducers";
import { getDependenciesFromInverseDependencies } from "../Debugger/helpers";
import {
  BACK_TO_CANVAS,
  BINDINGS_DISABLED_TOOLTIP,
  BINDING_SECTION_LABEL,
  createMessage,
  NO_CONNECTIONS,
  SCHEMA_WALKTHROUGH_DESC,
  SCHEMA_WALKTHROUGH_TITLE,
} from "@appsmith/constants/messages";
import type {
  SuggestedWidget,
  SuggestedWidget as SuggestedWidgetsType,
} from "api/ActionAPI";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { builderURL } from "RouteBuilder";
import { hasManagePagePermission } from "@appsmith/utils/permissionHelpers";
import DatasourceStructureHeader from "pages/Editor/Explorer/Datasources/DatasourceStructureHeader";
import { DatasourceStructureContainer as DataStructureList } from "pages/Editor/Explorer/Datasources/DatasourceStructureContainer";
import { DatasourceStructureContext } from "pages/Editor/Explorer/Datasources/DatasourceStructureContainer";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import {
  AB_TESTING_EVENT_KEYS,
  FEATURE_FLAG,
} from "@appsmith/entities/FeatureFlag";
import {
  getDatasourceStructureById,
  getPluginDatasourceComponentFromId,
  getPluginNameFromId,
} from "selectors/entitiesSelector";
import { DatasourceComponentTypes } from "api/PluginApi";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import {
  getFeatureFlagShownStatus,
  isUserSignedUpFlagSet,
  setFeatureFlagShownStatus,
} from "utils/storage";
import { PluginName } from "entities/Action";
import { getCurrentUser } from "selectors/usersSelectors";
import { Tooltip } from "design-system";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

const SCHEMA_GUIDE_GIF = `${ASSETS_CDN_URL}/schema.gif`;

const SCHEMA_SECTION_ID = "t--api-right-pane-schema";

const SideBar = styled.div`
  height: 100%;
  width: 100%;

  & > a {
    margin-top: 0;
    margin-left: 0;
  }

  .icon-text {
    display: flex;

    .connection-type {
      ${getTypographyByKey("p1")}
    }
  }

  .icon-text:nth-child(2) {
    padding-top: ${(props) => props.theme.spaces[7]}px;
  }

  .description {
    ${getTypographyByKey("p1")}
    margin-left: ${(props) => props.theme.spaces[2] + 1}px;
    padding-bottom: ${(props) => props.theme.spaces[7]}px;
  }

  @-webkit-keyframes slide-left {
    0% {
      -webkit-transform: translateX(100%);
      transform: translateX(100%);
    }
    100% {
      -webkit-transform: translateX(0);
      transform: translateX(0);
    }
  }
  @keyframes slide-left {
    0% {
      -webkit-transform: translateX(100%);
      transform: translateX(100%);
    }
    100% {
      -webkit-transform: translateX(0);
      transform: translateX(0);
    }
  }
`;

const BackToCanvasLink = styled(Link)`
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Label = styled.span`
  cursor: pointer;
`;

const CollapsibleWrapper = styled.div<{
  isOpen: boolean;
  isDisabled?: boolean;
}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${(props) => !!props.isDisabled && `opacity: 0.6`};

  &&&&&& .${BPClasses.COLLAPSE} {
    flex-grow: 1;
    overflow-y: auto !important;
  }

  .${BPClasses.COLLAPSE_BODY} {
    padding-top: ${(props) => props.theme.spaces[3]}px;
    height: 100%;
  }

  & > .icon-text:first-child {
    color: var(--ads-v2-color-fg);
    ${getTypographyByKey("h4")}
    cursor: pointer;
    .${Classes.ICON} {
      ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
    }

    .label {
      padding-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const SnipingWrapper = styled.div`
  ${getTypographyByKey("p1")}
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;

  img {
    max-width: 100%;
  }

  .image-wrapper {
    position: relative;
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }

  .widget:hover {
    cursor: pointer;
  }
`;
const Placeholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  height: 100%;
  padding: ${(props) => props.theme.spaces[8]}px;
  text-align: center;
`;

const DataStructureListWrapper = styled.div`
  overflow-y: scroll;
  height: 100%;
`;

const SchemaSideBarSection = styled.div<{ height: number; marginTop?: number }>`
  margin-top: ${(props) => props?.marginTop && `${props.marginTop}px`};
  height: auto;
  display: flex;
  width: 100%;
  flex-direction: column;
  ${(props) => props.height && `max-height: ${props.height}%;`}
`;

type CollapsibleProps = {
  expand?: boolean;
  children: ReactNode;
  label: string;
  customLabelComponent?: JSX.Element;
  isDisabled?: boolean;
};

type DisabledCollapsibleProps = {
  label: string;
  tooltipLabel?: string;
};

export function Collapsible({
  children,
  customLabelComponent,
  expand = true,
  label,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(!!expand);

  useEffect(() => {
    setIsOpen(expand);
  }, [expand]);

  return (
    <CollapsibleWrapper isOpen={isOpen}>
      <Label className="icon-text" onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? "down-arrow" : "arrow-right-s-line"} size="lg" />
        {!!customLabelComponent ? (
          customLabelComponent
        ) : (
          <Text className="label" kind="heading-xs">
            {label}
          </Text>
        )}
      </Label>
      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

export function DisabledCollapsible({
  label,
  tooltipLabel = "",
}: DisabledCollapsibleProps) {
  return (
    <Tooltip content={tooltipLabel}>
      <CollapsibleWrapper isDisabled isOpen={false}>
        <Label className="icon-text">
          <Icon name="arrow-right-s-line" size="lg" />
          <Text className="label" kind="heading-xs">
            {label}
          </Text>
        </Label>
      </CollapsibleWrapper>
    </Tooltip>
  );
}

export function useEntityDependencies(actionName: string) {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const entityDependencies = useMemo(
    () =>
      getDependenciesFromInverseDependencies(
        deps.inverseDependencyMap,
        actionName,
      ),
    [actionName, deps.inverseDependencyMap],
  );
  const hasDependencies =
    entityDependencies &&
    (entityDependencies?.directDependencies.length > 0 ||
      entityDependencies?.inverseDependencies.length > 0);
  return {
    hasDependencies,
    entityDependencies,
  };
}

function ActionSidebar({
  actionName,
  context,
  datasourceId,
  entityDependencies,
  hasConnections,
  hasResponse,
  pluginId,
  suggestedWidgets,
}: {
  actionName: string;
  hasResponse: boolean;
  hasConnections: boolean | null;
  suggestedWidgets?: SuggestedWidgetsType[];
  entityDependencies: {
    directDependencies: string[];
    inverseDependencies: string[];
  } | null;
  datasourceId: string;
  pluginId: string;
  context: DatasourceStructureContext;
}) {
  const dispatch = useDispatch();
  const widgets = useSelector(getWidgets);
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const user = useSelector(getCurrentUser);
  const { pushFeature } = useContext(WalkthroughContext) || {};
  const params = useParams<{
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();
  const handleBindData = () => {
    AnalyticsUtil.logEvent("SELECT_IN_CANVAS_CLICK", {
      actionName: actionName,
      apiId: params.apiId || params.queryId,
      appId: applicationId,
    });
    dispatch(
      bindDataOnCanvas({
        queryId: (params.apiId || params.queryId) as string,
        applicationId: applicationId as string,
        pageId: params.pageId,
      }),
    );
  };

  const pluginName = useSelector((state) =>
    getPluginNameFromId(state, pluginId || ""),
  );

  const pluginDatasourceForm = useSelector((state) =>
    getPluginDatasourceComponentFromId(state, pluginId || ""),
  );

  // A/B feature flag for datasource structure.
  const isEnabledForDSSchema = useSelector((state) =>
    selectFeatureFlagCheck(state, FEATURE_FLAG.ab_ds_schema_enabled),
  );

  // A/B feature flag for query binding.
  const isEnabledForQueryBinding = useSelector((state) =>
    selectFeatureFlagCheck(state, FEATURE_FLAG.ab_ds_binding_enabled),
  );

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  );

  useEffect(() => {
    if (
      datasourceId &&
      datasourceStructure === undefined &&
      pluginDatasourceForm !== DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      dispatch(
        fetchDatasourceStructure(
          datasourceId,
          true,
          DatasourceStructureContext.QUERY_EDITOR,
        ),
      );
    }
  }, []);

  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureFlagShownStatus(
      FEATURE_FLAG.ab_ds_schema_enabled,
    );

    const isNewUser = user && (await isUserSignedUpFlagSet(user.email));
    // Adding walkthrough tutorial
    isNewUser &&
      !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature({
        targetId: SCHEMA_SECTION_ID,
        onDismiss: async () => {
          AnalyticsUtil.logEvent("WALKTHROUGH_DISMISSED", {
            [AB_TESTING_EVENT_KEYS.abTestingFlagLabel]:
              FEATURE_FLAG.ab_ds_schema_enabled,
            [AB_TESTING_EVENT_KEYS.abTestingFlagValue]: isEnabledForDSSchema,
          });
          await setFeatureFlagShownStatus(
            FEATURE_FLAG.ab_ds_schema_enabled,
            true,
          );
        },
        details: {
          title: createMessage(SCHEMA_WALKTHROUGH_TITLE),
          description: createMessage(SCHEMA_WALKTHROUGH_DESC),
          imageURL: SCHEMA_GUIDE_GIF,
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
        eventParams: {
          [AB_TESTING_EVENT_KEYS.abTestingFlagLabel]:
            FEATURE_FLAG.ab_ds_schema_enabled,
          [AB_TESTING_EVENT_KEYS.abTestingFlagValue]: isEnabledForDSSchema,
        },
      });
  };

  const showSchema =
    isEnabledForDSSchema &&
    pluginDatasourceForm !== DatasourceComponentTypes.RestAPIDatasourceForm &&
    pluginName !== PluginName.SMTP;

  useEffect(() => {
    if (showSchema) {
      checkAndShowWalkthrough();
    }
  }, [showSchema]);

  const hasWidgets = Object.keys(widgets).length > 1;

  const pagePermissions = useSelector(getPagePermissions);

  const canEditPage = hasManagePagePermission(pagePermissions);

  const showSuggestedWidgets =
    canEditPage && hasResponse && suggestedWidgets && !!suggestedWidgets.length;
  const showSnipingMode = hasResponse && hasWidgets;

  if (
    !hasConnections &&
    !showSuggestedWidgets &&
    !showSnipingMode &&
    // putting this here to make the placeholder only appear for rest APIs.
    pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm
  ) {
    return <Placeholder>{createMessage(NO_CONNECTIONS)}</Placeholder>;
  }

  return (
    <SideBar>
      <BackToCanvasLink
        kind="secondary"
        startIcon="arrow-left-line"
        target="_self"
        to={builderURL({ pageId })}
      >
        {createMessage(BACK_TO_CANVAS)}
      </BackToCanvasLink>

      {showSchema && (
        <SchemaSideBarSection height={50} id={SCHEMA_SECTION_ID}>
          <Collapsible
            customLabelComponent={
              <DatasourceStructureHeader datasourceId={datasourceId || ""} />
            }
            expand={!showSuggestedWidgets}
            label="Schema"
          >
            <DataStructureListWrapper>
              <DataStructureList
                context={context}
                currentActionId={params?.queryId || ""}
                datasourceId={datasourceId || ""}
                datasourceStructure={datasourceStructure}
                pluginName={pluginName}
                step={0}
              />
            </DataStructureListWrapper>
          </Collapsible>
        </SchemaSideBarSection>
      )}

      {showSchema && isEnabledForQueryBinding && <Divider />}

      {hasConnections && !isEnabledForQueryBinding && (
        <Connections
          actionName={actionName}
          entityDependencies={entityDependencies}
        />
      )}
      {!isEnabledForQueryBinding &&
        canEditPage &&
        hasResponse &&
        Object.keys(widgets).length > 1 && (
          <Collapsible label="Connect widget">
            <SnipingWrapper>
              <Button
                className={"t--select-in-canvas"}
                kind="secondary"
                onClick={handleBindData}
                size="md"
              >
                Select widget
              </Button>
            </SnipingWrapper>
          </Collapsible>
        )}
      {showSuggestedWidgets ? (
        <SchemaSideBarSection height={40} marginTop={12}>
          <SuggestedWidgets
            actionName={actionName}
            hasWidgets={hasWidgets}
            suggestedWidgets={suggestedWidgets as SuggestedWidget[]}
          />
        </SchemaSideBarSection>
      ) : (
        isEnabledForQueryBinding && (
          <DisabledCollapsible
            label={createMessage(BINDING_SECTION_LABEL)}
            tooltipLabel={createMessage(BINDINGS_DISABLED_TOOLTIP)}
          />
        )
      )}
    </SideBar>
  );
}

export default ActionSidebar;
