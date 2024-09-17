import {
  GO_BACK,
  SKIP_START_WITH_USE_CASE_TEMPLATES,
  START_WITH_DATA_CONNECT_HEADING,
  START_WITH_DATA_CONNECT_SUBHEADING,
  createMessage,
} from "ee/constants/messages";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { getCurrentPluginIdForCreateNewApp } from "ee/selectors/applicationSelectors";
import {
  resetCurrentApplicationIdForCreateNewApp,
  resetCurrentPluginIdForCreateNewApp,
} from "actions/onboardingActions";
import { fetchPlugins } from "actions/pluginActions";
import { Flex, Link, Text } from "@appsmith/ads";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import { getApplicationsOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { default as React, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import history from "utils/history";
import { builderURL } from "ee/RouteBuilder";
import { getDatasource, getPlugin } from "ee/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import { PluginPackageName, PluginType } from "entities/Action";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { fetchMockDatasources } from "actions/datasourceActions";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import type { Datasource } from "entities/Datasource";
import { fetchingEnvironmentConfigs } from "ee/actions/environmentAction";
import { shouldShowLicenseBanner } from "ee/selectors/tenantSelectors";
import { isAirgapped } from "ee/utils/airgapHelpers";

const SectionWrapper = styled.div<{ isBannerVisible: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-7);
  ${(props) => `
    margin-top: ${
      props.theme.homePage.header + (props.isBannerVisible ? 40 : 0)
    }px;
  `}
  background: var(--ads-v2-color-gray-50);
  ${(props) => `
    min-height: calc(100vh - ${props.theme.homePage.header}px);
  `}
`;

const BackWrapper = styled.div<{ hidden?: boolean; isBannerVisible: boolean }>`
  position: sticky;
  display: flex;
  justify-content: space-between;
  ${(props) => `
    top: ${props.theme.homePage.header + (props.isBannerVisible ? 40 : 0)}px;
    `}
  background: inherit;
  padding: var(--ads-v2-spaces-3);
  z-index: 1;
  margin-left: -4px;
  ${(props) => `${props.hidden && "visibility: hidden; opacity: 0;"}`}
`;

const LinkWrapper = styled(Link)<{ hidden?: boolean }>`
  ${(props) => `${props.hidden && "visibility: hidden; opacity: 0;"}`}
`;

const WithDataWrapper = styled.div`
  background: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-13);
  border: 1px solid var(--ads-v2-color-gray-300);
  border-radius: 5px;
`;

const Header = ({ subtitle, title }: { subtitle: string; title: string }) => {
  return (
    <Flex flexDirection="column" mb="spaces-14" mt="spaces-7">
      <Text kind="heading-xl">{title}</Text>
      <Text>{subtitle}</Text>
    </Flex>
  );
};

const CreateNewAppsOption = ({
  currentApplicationIdForCreateNewApp,
}: {
  currentApplicationIdForCreateNewApp: string;
}) => {
  const createNewAppPluginId = useSelector(getCurrentPluginIdForCreateNewApp);
  const applications = useSelector(getApplicationsOfWorkspace);
  const selectedPlugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, createNewAppPluginId || ""),
  );
  const application = applications.find(
    (app) => app.id === currentApplicationIdForCreateNewApp,
  );

  const selectedDatasource: Datasource | undefined = useSelector((state) =>
    getDatasource(state, TEMP_DATASOURCE_ID || ""),
  );

  const isBannerVisible = useSelector(shouldShowLicenseBanner);
  const dispatch = useDispatch();

  const startWithData = () => {
    AnalyticsUtil.logEvent("CREATE_APP_FROM_DATA");
    // fetch plugins information to show list of all plugins
    dispatch(fetchPlugins({ workspaceId: application?.workspaceId }));
    // For air-gapped version as internet access won't necessarily be available, we skip fetching mock datasources.
    if (!isAirgapped()) dispatch(fetchMockDatasources());
    if (application?.workspaceId) {
      dispatch(
        fetchingEnvironmentConfigs({
          editorId: application.id,
          fetchDatasourceMeta: true,
          workspaceId: application?.workspaceId,
        }),
      );
    }
  };

  const resetCreateNewAppFlow = () => {
    dispatch(resetCurrentApplicationIdForCreateNewApp());
  };

  const addAnalyticEventsForSkip = () => {
    if (createNewAppPluginId) {
      AnalyticsUtil.logEvent(
        "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_DATASOURCE_FORM_PAGE",
        {
          pluginId: createNewAppPluginId,
        },
      );
    } else {
      AnalyticsUtil.logEvent(
        "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_START_FROM_DATA_PAGE",
      );
    }
  };

  const onClickSkipButton = () => {
    const applicationObject = application!;
    urlBuilder.updateURLParams(
      {
        applicationSlug: applicationObject.slug,
        applicationVersion: applicationObject.applicationVersion,
        baseApplicationId: applicationObject.baseId,
      },
      applicationObject.pages.map((page) => ({
        pageSlug: page.slug,
        customSlug: page.customSlug,
        basePageId: page.baseId,
      })),
    );
    history.push(
      builderURL({
        basePageId: applicationObject.pages[0].baseId,
      }),
    );

    addAnalyticEventsForSkip();
  };

  const onClickBackButton = () => {
    if (createNewAppPluginId) {
      AnalyticsUtil.logEvent(
        "ONBOARDING_FLOW_CLICK_BACK_BUTTON_DATASOURCE_FORM_PAGE",
        { pluginId: createNewAppPluginId },
      );
      dispatch(resetCurrentPluginIdForCreateNewApp());
    }
  };

  useEffect(() => {
    if (application) {
      urlBuilder.updateURLParams(
        {
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
          baseApplicationId: application.baseId,
        },
        application.pages.map((page) => ({
          pageSlug: page.slug,
          customSlug: page.customSlug,
          basePageId: page.baseId,
        })),
      );

      startWithData();
    }
  }, [application]);

  useEffect(() => {
    AnalyticsUtil.logEvent("ONBOARDING_CREATE_APP_FLOW");

    return () => {
      resetCreateNewAppFlow();
    };
  }, []);

  const isBackButtonHidden = !createNewAppPluginId || !selectedDatasource;

  return (
    <SectionWrapper isBannerVisible={!!isBannerVisible}>
      <BackWrapper isBannerVisible={!!isBannerVisible}>
        <LinkWrapper
          className="t--create-new-app-option-goback"
          data-testid="t--create-new-app-option-goback"
          hidden={isBackButtonHidden}
          onClick={onClickBackButton}
          startIcon="arrow-left-line"
        >
          {createMessage(GO_BACK)}
        </LinkWrapper>
        {application && (
          <LinkWrapper
            className="t--create-new-app-option-skip"
            data-testid="t--create-new-app-option-skip"
            endIcon="arrow-right-line"
            onClick={onClickSkipButton}
          >
            {createMessage(SKIP_START_WITH_USE_CASE_TEMPLATES)}
          </LinkWrapper>
        )}
      </BackWrapper>
      <Flex flexDirection="column" pl="spaces-3" pr="spaces-3">
        <Header
          subtitle={createMessage(START_WITH_DATA_CONNECT_SUBHEADING)}
          title={createMessage(START_WITH_DATA_CONNECT_HEADING)}
        />
        <WithDataWrapper>
          {createNewAppPluginId && !!selectedDatasource ? (
            selectedPlugin?.type === PluginType.SAAS ? (
              <DatasourceForm
                datasourceId={TEMP_DATASOURCE_ID}
                isOnboardingFlow
                pageId={application?.defaultPageId || ""}
                pluginPackageName={PluginPackageName.GOOGLE_SHEETS}
              />
            ) : (
              <DataSourceEditor
                applicationId={currentApplicationIdForCreateNewApp}
                datasourceId={TEMP_DATASOURCE_ID}
                isOnboardingFlow
                pageId={application?.defaultPageId}
              />
            )
          ) : (
            <CreateNewDatasourceTab isOnboardingScreen />
          )}
        </WithDataWrapper>
      </Flex>
    </SectionWrapper>
  );
};

export default CreateNewAppsOption;
