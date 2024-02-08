import React, { useContext, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";
import { Divider } from "design-system";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";
import { getDependenciesFromInverseDependencies } from "../Debugger/helpers";
import {
  createMessage,
  NO_CONNECTIONS,
  SCHEMA_WALKTHROUGH_DESC,
  SCHEMA_WALKTHROUGH_TITLE,
} from "@appsmith/constants/messages";
import DatasourceStructureHeader from "pages/Editor/DatasourceInfo/DatasourceStructureHeader";
import { DatasourceStructureContainer as DataStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getPluginDatasourceComponentFromId,
  getPluginNameFromId,
} from "@appsmith/selectors/entitiesSelector";
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
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { DatasourceStructureContext } from "entities/Datasource";
import Collapsible, {
  CollapsibleGroup,
  CollapsibleGroupContainer,
} from "components/common/Collapsible";

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
  overflow-y: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const CollapsibleSection = styled.div<{
  height: string;
  marginTop?: number;
  paddingTop?: number;
}>`
  margin-top: ${(props) => props.marginTop && `${props.marginTop}px`};
  padding-top: ${(props) => props.paddingTop && `${props.paddingTop}px`};
  height: auto;
  display: flex;
  width: 100%;
  flex-direction: column;
  ${(props) => props.height && `height: ${props.height};`}
  & > div {
    height: 100%;
  }
`;

const StyledDivider = styled(Divider)`
  display: block;
`;

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
  actionRightPaneBackLink,
  additionalSections,
  context,
  datasourceId,
  hasConnections,
  hasResponse,
  pluginId,
  showSchema,
  showSuggestedWidgets = true,
}: {
  actionName: string;
  hasResponse: boolean;
  hasConnections: boolean | null;
  datasourceId: string;
  pluginId: string;
  context: DatasourceStructureContext;
  additionalSections?: React.ReactNode;
  actionRightPaneBackLink: React.ReactNode;
  showSuggestedWidgets?: boolean;
  showSchema: boolean;
}) {
  const dispatch = useDispatch();
  const widgets = useSelector(getWidgets);
  const user = useSelector(getCurrentUser);
  const { pushFeature } = useContext(WalkthroughContext) || {};
  const schemaRef = useRef<HTMLDivElement | null>(null);
  const bindingRef = useRef<HTMLDivElement | null>(null);
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
        delay: 2500,
      });
  };

  const handleCustomCollapse = (openStatus: boolean) => {
    if (schemaRef.current && bindingRef.current) {
      if (openStatus) {
        schemaRef.current.style.height = "";
        bindingRef.current.style.height = "";
      } else {
        schemaRef.current.style.height = "auto";
        bindingRef.current.style.height = "calc(90% - 40px)";
      }
    }
  };

  useEffect(() => {
    if (showSchema) {
      checkAndShowWalkthrough();
    }
  }, [showSchema]);

  const showSnipingMode = hasResponse && hasWidgets;

  if (
    !hasConnections &&
    !showSnipingMode &&
    // putting this here to make the placeholder only appear for rest APIs.
    pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm
  ) {
    return <Placeholder>{createMessage(NO_CONNECTIONS)}</Placeholder>;
  }

  if (!additionalSections && !showSchema && !showSuggestedWidgets) {
    return null;
  }

  return (
    <SideBar>
      {actionRightPaneBackLink}
      <CollapsibleGroupContainer>
        {additionalSections && (
          <CollapsibleGroup maxHeight={"50%"}>
            {additionalSections}
          </CollapsibleGroup>
        )}
        <CollapsibleGroup height={additionalSections ? "50%" : "100%"}>
          {showSchema && (
            <>
              {additionalSections && <StyledDivider />}
              <CollapsibleSection
                data-testId="datasource-schema-container"
                height={
                  datasourceStructure?.tables?.length && !isLoadingSchema
                    ? showSuggestedWidgets
                      ? "50%"
                      : "100%"
                    : "auto"
                }
                id={SCHEMA_SECTION_ID}
                ref={schemaRef}
              >
                <Collapsible
                  CustomLabelComponent={DatasourceStructureHeader}
                  datasource={{ id: datasourceId }}
                  handleCustomCollapse={handleCustomCollapse}
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
            </>
          )}
        </CollapsibleGroup>
      </CollapsibleGroupContainer>
    </SideBar>
  );
}

export default ActionSidebar;
