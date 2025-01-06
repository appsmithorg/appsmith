import React, { useCallback, useEffect, useRef } from "react";
import { connect, useSelector } from "react-redux";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { PluginPackageName, PluginType } from "entities/Action";
import { getQueryParams } from "utils/URLUtils";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getAssetUrl, isAirgapped } from "ee/utils/airgapHelpers";
import { Spinner } from "@appsmith/ads";
import { useEditorType } from "ee/hooks";
import { useParentEntityInfo } from "ee/hooks/datasourceEditorHooks";
import { createNewApiActionBasedOnEditorType } from "ee/actions/helpers";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import {
  DatasourceContainer,
  DatasourceSection,
  DatasourceSectionHeading,
  StyledDivider,
} from "./IntegrationStyledComponents";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import DatasourceItem from "./DatasourceItem";
import {
  CREATE_NEW_API_SECTION_HEADER,
  CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API,
  CREATE_NEW_DATASOURCE_GRAPHQL_API,
  CREATE_NEW_DATASOURCE_REST_API,
  CREATE_NEW_SAAS_SECTION_HEADER,
  createMessage,
} from "ee/constants/messages";
import scrollIntoView from "scroll-into-view-if-needed";
import PremiumDatasources from "./PremiumDatasources";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import {
  PREMIUM_INTEGRATIONS,
  type PremiumIntegration,
} from "./PremiumDatasources/Constants";

interface CreateAPIOrSaasPluginsProps {
  location: {
    search: string;
  };
  isCreating?: boolean;
  showUnsupportedPluginDialog: (callback: () => void) => void;
  isOnboardingScreen?: boolean;
  active?: boolean;
  pageId: string;
  showSaasAPIs?: boolean; // If this is true, only SaaS APIs will be shown
  plugins: Plugin[];
  createDatasourceFromForm: typeof createDatasourceFromForm;
  createTempDatasourceFromForm: typeof createTempDatasourceFromForm;
  createNewApiActionBasedOnEditorType: (
    editorType: string,
    editorId: string,
    parentEntityId: string,
    parentEntityType: ActionParentEntityTypeInterface,
    apiType: string,
  ) => void;
  isPremiumDatasourcesViewEnabled?: boolean;
  premiumPlugins: PremiumIntegration[];
  authApiPlugin?: Plugin;
  restAPIVisible?: boolean;
  graphQLAPIVisible?: boolean;
}

export const API_ACTION = {
  IMPORT_CURL: "IMPORT_CURL",
  CREATE_NEW_API: "CREATE_NEW_API",
  CREATE_NEW_GRAPHQL_API: "CREATE_NEW_GRAPHQL_API",
  CREATE_DATASOURCE_FORM: "CREATE_DATASOURCE_FORM",
  AUTH_API: "AUTH_API",
};

function APIOrSaasPlugins(props: CreateAPIOrSaasPluginsProps) {
  const { authApiPlugin, isCreating, isOnboardingScreen, pageId, plugins } =
    props;
  const editorType = useEditorType(location.pathname);
  const { editorId, parentEntityId, parentEntityType } =
    useParentEntityInfo(editorType);
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const handleCreateAuthApiDatasource = useCallback(() => {
    if (authApiPlugin) {
      AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_AUTH_API_CLICK", {
        pluginId: authApiPlugin.id,
      });
      AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
        pluginName: authApiPlugin.name,
        pluginPackageName: authApiPlugin.packageName,
      });
      props.createTempDatasourceFromForm({
        pluginId: authApiPlugin.id,
        type: authApiPlugin.type,
      });
    }
  }, [authApiPlugin, props.createTempDatasourceFromForm]);

  const handleCreateNew = (source: string) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      source,
    });
    props.createNewApiActionBasedOnEditorType(
      editorType,
      editorId,
      // Set parentEntityId as (parentEntityId or if it is onboarding screen then set it as pageId) else empty string
      parentEntityId || (isOnboardingScreen && pageId) || "",
      parentEntityType,
      source === API_ACTION.CREATE_NEW_GRAPHQL_API
        ? PluginPackageName.GRAPHQL
        : PluginPackageName.REST_API,
    );
  };

  // On click of any API card, handleOnClick action should be called to check if user came from generate-page flow.
  // if yes then show UnsupportedDialog for the API which are not supported to generate CRUD page.
  const handleOnClick = (
    actionType: string,
    params?: {
      skipValidPluginCheck?: boolean;
      pluginId?: string;
      type?: PluginType;
    },
  ) => {
    const queryParams = getQueryParams();
    const isGeneratePageInitiator = getIsGeneratePageInitiator(
      queryParams.isGeneratePageMode,
    );

    if (
      isGeneratePageInitiator &&
      !params?.skipValidPluginCheck &&
      (!params?.pluginId || !generateCRUDSupportedPlugin[params.pluginId])
    ) {
      // show modal informing user that this will break the generate flow.
      props.showUnsupportedPluginDialog(() =>
        handleOnClick(actionType, { skipValidPluginCheck: true, ...params }),
      );

      return;
    }

    switch (actionType) {
      case API_ACTION.CREATE_NEW_API:
      case API_ACTION.CREATE_NEW_GRAPHQL_API:
        handleCreateNew(actionType);
        break;
      case API_ACTION.CREATE_DATASOURCE_FORM: {
        if (params) {
          props.createTempDatasourceFromForm({
            pluginId: params.pluginId!,
            type: params.type!,
          });
        }

        break;
      }
      case API_ACTION.AUTH_API: {
        handleCreateAuthApiDatasource();
        break;
      }
      default:
    }
  };

  // Api plugins with Graphql

  return (
    <DatasourceContainer data-testid="newapi-datasource-card-container">
      {props.restAPIVisible && (
        <DatasourceItem
          className="t--createBlankApiCard create-new-api"
          dataCardWrapperTestId="newapi-datasource-content-wrapper"
          handleOnClick={() => handleOnClick(API_ACTION.CREATE_NEW_API)}
          icon={getAssetUrl(`${ASSETS_CDN_URL}/plus.png`)}
          name={createMessage(CREATE_NEW_DATASOURCE_REST_API)}
          rightSibling={isCreating && <Spinner className="cta" size={"sm"} />}
        />
      )}
      {props.graphQLAPIVisible && (
        <DatasourceItem
          className="t--createBlankApiGraphqlCard"
          dataCardWrapperTestId="graphqlapi-datasource-content-wrapper"
          handleOnClick={() => handleOnClick(API_ACTION.CREATE_NEW_GRAPHQL_API)}
          icon={getAssetUrl(`${ASSETS_CDN_URL}/GraphQL.png`)}
          name={createMessage(CREATE_NEW_DATASOURCE_GRAPHQL_API)}
        />
      )}
      {authApiPlugin && (
        <DatasourceItem
          className="t--createAuthApiDatasource"
          dataCardWrapperTestId="authapi-datasource-content-wrapper"
          handleOnClick={() => handleOnClick(API_ACTION.AUTH_API)}
          icon={getAssetUrl(authApiPlugin.iconLocation)}
          name={createMessage(CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API)}
        />
      )}
      {plugins.map((p) => (
        <DatasourceItem
          handleOnClick={() => {
            AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
              pluginName: p.name,
              pluginPackageName: p.packageName,
            });
            handleOnClick(API_ACTION.CREATE_DATASOURCE_FORM, {
              pluginId: p.id,
            });
          }}
          icon={getAssetUrl(p.iconLocation)}
          key={p.id}
          name={p.name}
        />
      ))}
      <PremiumDatasources plugins={props.premiumPlugins} />
    </DatasourceContainer>
  );
}

function CreateAPIOrSaasPlugins(props: CreateAPIOrSaasPluginsProps) {
  const newAPIRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const isAirgappedInstance = isAirgapped();

  useEffect(() => {
    if (props.active && newAPIRef.current) {
      isMounted.current &&
        scrollIntoView(newAPIRef.current, {
          behavior: "smooth",
          scrollMode: "always",
          block: "start",
          boundary: document.getElementById("new-integrations-wrapper"),
        });
    } else {
      isMounted.current = true;
    }
  }, [props.active]);

  if (isAirgappedInstance && props.showSaasAPIs) return null;

  if (
    props.premiumPlugins.length === 0 &&
    props.plugins.length === 0 &&
    !props.restAPIVisible &&
    !props.graphQLAPIVisible
  )
    return null;

  return (
    <>
      <StyledDivider />
      <DatasourceSection id="new-api" ref={newAPIRef}>
        <DatasourceSectionHeading kind="heading-m">
          {props.showSaasAPIs
            ? createMessage(CREATE_NEW_SAAS_SECTION_HEADER)
            : createMessage(CREATE_NEW_API_SECTION_HEADER)}
        </DatasourceSectionHeading>
        <APIOrSaasPlugins {...props} />
      </DatasourceSection>
    </>
  );
}

const mapStateToProps = (
  state: AppState,
  props: { showSaasAPIs?: boolean; isPremiumDatasourcesViewEnabled: boolean },
) => {
  const searchedPlugin = (
    pluginSearchSelector(state, "search") || ""
  ).toLocaleLowerCase();

  const allPlugins = getPlugins(state);

  let plugins = allPlugins.filter((p) =>
    !props.showSaasAPIs
      ? p.packageName === PluginPackageName.GRAPHQL
      : p.type === PluginType.SAAS || p.type === PluginType.REMOTE,
  );

  plugins = plugins.filter((p) =>
    p.name.toLocaleLowerCase().includes(searchedPlugin),
  );

  let authApiPlugin = !props.showSaasAPIs
    ? allPlugins.find((p) => p.name === "REST API")
    : undefined;

  authApiPlugin = createMessage(CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API)
    .toLocaleLowerCase()
    .includes(searchedPlugin)
    ? authApiPlugin
    : undefined;

  const premiumPlugins =
    props.showSaasAPIs && props.isPremiumDatasourcesViewEnabled
      ? PREMIUM_INTEGRATIONS.filter((p) =>
          p.name.toLocaleLowerCase().includes(searchedPlugin),
        )
      : [];

  const restAPIVisible =
    !props.showSaasAPIs &&
    createMessage(CREATE_NEW_DATASOURCE_REST_API)
      .toLocaleLowerCase()
      .includes(searchedPlugin);
  const graphQLAPIVisible =
    !props.showSaasAPIs &&
    createMessage(CREATE_NEW_DATASOURCE_GRAPHQL_API)
      .toLocaleLowerCase()
      .includes(searchedPlugin);

  return {
    plugins,
    premiumPlugins,
    authApiPlugin,
    restAPIVisible,
    graphQLAPIVisible,
  };
};

const mapDispatchToProps = {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
  createNewApiActionBasedOnEditorType,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CreateAPIOrSaasPlugins);
