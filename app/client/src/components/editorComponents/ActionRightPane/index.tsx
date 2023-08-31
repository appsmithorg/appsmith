import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import { Classes, getTypographyByKey } from "design-system-old";
import { Divider, Icon, Link, Text } from "design-system";
import SuggestedWidgets from "./SuggestedWidgets";
import type { ReactNode, MutableRefObject } from "react";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
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
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { builderURL } from "RouteBuilder";
import { hasManagePagePermission } from "@appsmith/utils/permissionHelpers";
import DatasourceStructureHeader from "pages/Editor/Explorer/Datasources/DatasourceStructureHeader";
import {
  DatasourceStructureContainer as DataStructureList,
  SCHEMALESS_PLUGINS,
} from "pages/Editor/Explorer/Datasources/DatasourceStructureContainer";
import { DatasourceStructureContext } from "pages/Editor/Explorer/Datasources/DatasourceStructure";
import { adaptiveSignpostingEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getPluginDatasourceComponentFromId,
  getPluginNameFromId,
} from "selectors/entitiesSelector";
import { DatasourceComponentTypes } from "api/PluginApi";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import {
  getFeatureWalkthroughShown,
  isUserSignedUpFlagSet,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { SCHEMA_SECTION_ID } from "entities/Action";
import { getCurrentUser } from "selectors/usersSelectors";
import { Tooltip } from "design-system";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import history from "utils/history";
import { SignpostingWalkthroughConfig } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const SCHEMA_GUIDE_GIF = `${ASSETS_CDN_URL}/schema.gif`;

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
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CollapsibleSection = styled.div<{ height: string; marginTop?: number }>`
  margin-top: ${(props) => props?.marginTop && `${props.marginTop}px`};
  height: auto;
  display: flex;
  width: 100%;
  flex-direction: column;
  ${(props) => props.height && `height: ${props.height};`}
  & > div {
    height: 100%;
  }
`;

type CollapsibleProps = {
  expand?: boolean;
  children: ReactNode;
  label: string;
  CustomLabelComponent?: (props: any) => JSX.Element;
  isDisabled?: boolean;
  datasourceId?: string;
  containerRef?: MutableRefObject<HTMLDivElement | null>;
};

type DisabledCollapsibleProps = {
  label: string;
  tooltipLabel?: string;
};

export function Collapsible({
  children,
  containerRef,
  CustomLabelComponent,
  datasourceId,
  expand = true,
  label,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(!!expand);

  const handleCollapse = (openStatus: boolean) => {
    if (containerRef?.current) {
      if (openStatus) {
        containerRef.current.style.height = "";
      } else {
        containerRef.current.style.height = "auto";
      }
    }
    setIsOpen(openStatus);
  };

  useEffect(() => {
    handleCollapse(expand);
  }, [expand]);

  return (
    <CollapsibleWrapper isOpen={isOpen}>
      <Label className="icon-text" onClick={() => handleCollapse(!isOpen)}>
        <Icon
          className="collapsible-icon"
          name={isOpen ? "down-arrow" : "arrow-right-s-line"}
          size="lg"
        />
        {!!CustomLabelComponent ? (
          <CustomLabelComponent
            datasourceId={datasourceId}
            onRefreshCallback={() => handleCollapse(true)}
          />
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
  hasConnections,
  hasResponse,
  pluginId,
  suggestedWidgets,
}: {
  actionName: string;
  hasResponse: boolean;
  hasConnections: boolean | null;
  suggestedWidgets?: SuggestedWidgetsType[];
  datasourceId: string;
  pluginId: string;
  context: DatasourceStructureContext;
}) {
  const dispatch = useDispatch();
  const widgets = useSelector(getWidgets);
  const pageId = useSelector(getCurrentPageId);
  const user = useSelector(getCurrentUser);
  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};
  const schemaRef = useRef(null);
  const params = useParams<{
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();

  const pluginName = useSelector((state) =>
    getPluginNameFromId(state, pluginId || ""),
  );

  const pluginDatasourceForm = useSelector((state) =>
    getPluginDatasourceComponentFromId(state, pluginId || ""),
  );

  const isLoadingSchema = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, datasourceId),
  );

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  );

  const hasWidgets = Object.keys(widgets).length > 1;

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
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.ds_schema,
    );

    const isNewUser = user && (await isUserSignedUpFlagSet(user.email));
    // Adding walkthrough tutorial
    isNewUser &&
      !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature({
        targetId: `#${SCHEMA_SECTION_ID}`,
        onDismiss: async () => {
          await setFeatureWalkthroughShown(
            FEATURE_WALKTHROUGH_KEYS.ds_schema,
            true,
          );
        },
        details: {
          title: createMessage(SCHEMA_WALKTHROUGH_TITLE),
          description: createMessage(SCHEMA_WALKTHROUGH_DESC),
          imageURL: getAssetUrl(SCHEMA_GUIDE_GIF),
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
          [FEATURE_WALKTHROUGH_KEYS.ds_schema]: true,
        },
        delay: 5000,
      });
  };

  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const adaptiveSignposting = useSelector(adaptiveSignpostingEnabled);
  const checkAndShowBackToCanvasWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.back_to_canvas,
    );
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(SignpostingWalkthroughConfig.BACK_TO_CANVAS);
  };
  useEffect(() => {
    if (!hasWidgets && adaptiveSignposting && signpostingEnabled) {
      checkAndShowBackToCanvasWalkthrough();
    }
  }, [hasWidgets, adaptiveSignposting, signpostingEnabled]);

  const showSchema =
    pluginDatasourceForm !== DatasourceComponentTypes.RestAPIDatasourceForm &&
    !SCHEMALESS_PLUGINS.includes(pluginName);

  useEffect(() => {
    if (showSchema) {
      checkAndShowWalkthrough();
    }
  }, [showSchema]);

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

  const handleCloseWalkthrough = () => {
    if (isWalkthroughOpened && popFeature) {
      popFeature();
    }
  };

  return (
    <SideBar>
      <BackToCanvasLink
        id="back-to-canvas"
        kind="secondary"
        onClick={() => {
          history.push(builderURL({ pageId }));

          handleCloseWalkthrough();
        }}
        startIcon="arrow-left-line"
      >
        {createMessage(BACK_TO_CANVAS)}
      </BackToCanvasLink>

      {showSchema && (
        <CollapsibleSection
          height={
            datasourceStructure?.tables?.length && !isLoadingSchema
              ? "50%"
              : "auto"
          }
          id={SCHEMA_SECTION_ID}
          ref={schemaRef}
        >
          <Collapsible
            CustomLabelComponent={DatasourceStructureHeader}
            containerRef={schemaRef}
            datasourceId={datasourceId}
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
        </CollapsibleSection>
      )}

      {showSchema && <Divider />}
      {showSuggestedWidgets ? (
        <CollapsibleSection height={"40%"} marginTop={12}>
          <SuggestedWidgets
            actionName={actionName}
            hasWidgets={hasWidgets}
            suggestedWidgets={suggestedWidgets as SuggestedWidget[]}
          />
        </CollapsibleSection>
      ) : (
        <DisabledCollapsible
          label={createMessage(BINDING_SECTION_LABEL)}
          tooltipLabel={createMessage(BINDINGS_DISABLED_TOOLTIP)}
        />
      )}
    </SideBar>
  );
}

export default ActionSidebar;
