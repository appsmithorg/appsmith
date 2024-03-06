import {
  CREATE_NEW_APPS_STEP_SUBTITLE,
  CREATE_NEW_APPS_STEP_TITLE,
  GO_BACK,
  SKIP_START_WITH_USE_CASE_TEMPLATES,
  START_FROM_SCRATCH_SUBTITLE,
  START_FROM_SCRATCH_TITLE,
  START_FROM_TEMPLATE_SUBTITLE,
  START_FROM_TEMPLATE_TITLE,
  START_WITH_DATA_CONNECT_HEADING,
  START_WITH_DATA_CONNECT_SUBHEADING,
  START_WITH_DATA_SUBTITLE,
  START_WITH_DATA_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import type { AppState } from "@appsmith/reducers";
import { getCurrentPluginIdForCreateNewApp } from "@appsmith/selectors/applicationSelectors";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import {
  firstTimeUserOnboardingInit,
  resetCurrentApplicationIdForCreateNewApp,
  resetCurrentPluginIdForCreateNewApp,
} from "actions/onboardingActions";
import { fetchPlugins } from "actions/pluginActions";
import {
  getAllTemplates,
  getTemplateFilters,
  importTemplateIntoApplicationViaOnboardingFlow,
  setActiveLoadingTemplateId,
} from "actions/templateActions";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Flex, Link, Text } from "design-system";
import { isEmpty } from "lodash";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import { getApplicationsOfWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { TemplateView } from "pages/Templates/TemplateView";
import { default as React, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  allTemplatesFiltersSelector,
  getTemplatesSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { builderURL } from "@appsmith/RouteBuilder";
import { getDatasource, getPlugin } from "@appsmith/selectors/entitiesSelector";
import type { Plugin } from "api/PluginApi";
import { PluginPackageName, PluginType } from "entities/Action";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { fetchMockDatasources } from "actions/datasourceActions";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import type { Datasource } from "entities/Datasource";
import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import StartWithTemplatesWrapper from "./StartWithTemplatesWrapper";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import type { Template } from "api/TemplatesApi";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";

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

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
  padding: var(--ads-v2-spaces-7) 0;
`;

const CardsWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 48px;
  flex-wrap: wrap;
  justify-content: center;
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 48px;
  border: 1px solid var(--ads-v2-color-border);
  width: 324px;
  align-items: center;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  background: var(--ads-v2-color-bg);
  img {
    height: 160px;
    margin-bottom: 48px;
  }
  position: relative;
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

interface CardProps {
  onClick?: () => void;
  src: string;
  subTitle: string;
  testid: string;
  title: string;
}

const Card = ({ onClick, src, subTitle, testid, title }: CardProps) => {
  return (
    <CardContainer data-testid={testid} onClick={onClick}>
      <img alt={title} src={src} />
      <Text kind="heading-s">{title}</Text>
      <Text>{subTitle}</Text>
    </CardContainer>
  );
};

const START_WITH_TYPE = {
  TEMPLATE: "TEMPLATE",
  DATA: "DATA",
};
type TYPE_START_WITH_TYPE = keyof typeof START_WITH_TYPE;
type TYPE_START_WITH_TYPE_VALUE =
  (typeof START_WITH_TYPE)[TYPE_START_WITH_TYPE];

const CreateNewAppsOption = ({
  currentApplicationIdForCreateNewApp,
  onClickBack,
}: {
  currentApplicationIdForCreateNewApp: string;
  onClickBack: () => void;
}) => {
  const [useType, setUseType] = useState<
    TYPE_START_WITH_TYPE_VALUE | undefined
  >();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const templatesCount = useSelector(
    (state: AppState) => state.ui.templates.templates.length,
  );
  const filters = useSelector(allTemplatesFiltersSelector);
  const isImportingTemplate = useSelector(isImportingTemplateToAppSelector);
  const allTemplates = useSelector(getTemplatesSelector);
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

  const isEnabledForStartWithDataDefault = useFeatureFlag(
    FEATURE_FLAG.ab_start_with_data_default_enabled,
  );

  const isBannerVisible = useSelector(shouldShowLicenseBanner);

  const dispatch = useDispatch();
  const onClickStartFromTemplate = () => {
    AnalyticsUtil.logEvent("CREATE_APP_FROM_TEMPLATE");

    if (isEmpty(filters.functions)) {
      dispatch(getTemplateFilters());
    }

    if (!templatesCount) {
      dispatch(getAllTemplates());
    }
    setUseType(START_WITH_TYPE.TEMPLATE);
  };

  const onClickStartFromScratch = () => {
    if (application) {
      AnalyticsUtil.logEvent("CREATE_APP_FROM_SCRATCH");
      dispatch(
        firstTimeUserOnboardingInit(
          application.id,
          application.defaultPageId as string,
        ),
      );
    }
  };

  const onClickStartWithData = () => {
    AnalyticsUtil.logEvent("CREATE_APP_FROM_DATA", {
      [FEATURE_FLAG.ab_start_with_data_default_enabled]:
        isEnabledForStartWithDataDefault,
    });
    // fetch plugins information to show list of all plugins
    dispatch(fetchPlugins({ workspaceId: application?.workspaceId }));
    dispatch(fetchMockDatasources());
    if (application?.workspaceId) {
      dispatch(
        fetchingEnvironmentConfigs({
          editorId: application.id,
          fetchDatasourceMeta: true,
          workspaceId: application?.workspaceId,
        }),
      );
    }
    setUseType(START_WITH_TYPE.DATA);
  };

  const goBackToInitialScreen = () => {
    setUseType(undefined);
  };

  const getTemplateById = (id: string) => {
    const template = allTemplates.find((template) => template.id === id);
    return template;
  };

  const resetCreateNewAppFlow = () => {
    dispatch(resetCurrentApplicationIdForCreateNewApp());
  };

  const onClickUseTemplate = (id: string) => {
    const template = getTemplateById(id);
    if (template) {
      AnalyticsUtil.logEvent("USE_TEMPLATE_FROM_DETAILS_PAGE_WHEN_ONBOARDING", {
        title: template.title,
      });
      // When Use template is clicked on template view detail screen
      if (!isImportingTemplate && application) {
        dispatch(
          importTemplateIntoApplicationViaOnboardingFlow(
            id,
            template.title as string,
            template.pages.map((p) => p.name),
            application.id,
            application.workspaceId,
          ),
        );
      }
    }
  };

  const addAnalyticEventsForSkip = () => {
    if (useType === START_WITH_TYPE.TEMPLATE) {
      if (selectedTemplate) {
        const template = getTemplateById(selectedTemplate);
        if (template) {
          AnalyticsUtil.logEvent(
            "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_TEMPLATE_DETAILS_PAGE",
            { title: template.title },
          );
        }
      } else {
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_START_FROM_TEMPLATE_PAGE",
        );
      }
    } else if (useType === START_WITH_TYPE.DATA) {
      if (createNewAppPluginId) {
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_DATASOURCE_FORM_PAGE",
          {
            pluginId: createNewAppPluginId,
            [FEATURE_FLAG.ab_start_with_data_default_enabled]:
              isEnabledForStartWithDataDefault,
          },
        );
      } else {
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_SKIP_BUTTON_START_FROM_DATA_PAGE",
          {
            [FEATURE_FLAG.ab_start_with_data_default_enabled]:
              isEnabledForStartWithDataDefault,
          },
        );
      }
    }
  };

  const onClickSkipButton = () => {
    if (application) {
      urlBuilder.updateURLParams(
        {
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
          applicationId: application.id,
        },
        application.pages.map((page) => ({
          pageSlug: page.slug,
          customSlug: page.customSlug,
          pageId: page.id,
        })),
      );
      history.push(
        builderURL({
          pageId: application.pages[0].id,
        }),
      );
    }

    addAnalyticEventsForSkip();
  };

  const onClickBackButton = () => {
    if (isImportingTemplate) return;
    if (useType === START_WITH_TYPE.TEMPLATE) {
      if (selectedTemplate) {
        // Going back from template details view screen
        const template = getTemplateById(selectedTemplate);
        if (template) {
          AnalyticsUtil.logEvent(
            "ONBOARDING_FLOW_CLICK_BACK_BUTTON_TEMPLATE_DETAILS_PAGE",
            { title: template.title },
          );
        }
        setSelectedTemplate("");
      } else {
        // Going back from start from template screen
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_BACK_BUTTON_START_FROM_TEMPLATE_PAGE",
        );
        goBackToInitialScreen();
      }
    } else if (useType === START_WITH_TYPE.DATA) {
      if (createNewAppPluginId) {
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_BACK_BUTTON_DATASOURCE_FORM_PAGE",
          { pluginId: createNewAppPluginId },
        );
        dispatch(resetCurrentPluginIdForCreateNewApp());
      } else {
        // Going back from start from data screen
        AnalyticsUtil.logEvent(
          "ONBOARDING_FLOW_CLICK_BACK_BUTTON_START_FROM_DATA_PAGE",
        );
        goBackToInitialScreen();
      }
    } else {
      // Going back from create new app flow
      AnalyticsUtil.logEvent(
        "ONBOARDING_FLOW_CLICK_BACK_BUTTON_CREATE_NEW_APP_PAGE",
      );
      onClickBack();
    }
  };

  const renderStartWithData = useCallback(() => {
    return (
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
    );
  }, [createNewAppPluginId, selectedDatasource, selectedPlugin]);

  const selectionOptions: CardProps[] = [
    {
      onClick: onClickStartWithData,
      src: getAssetUrl(`${ASSETS_CDN_URL}/start-with-data.svg`),
      subTitle: createMessage(START_WITH_DATA_SUBTITLE),
      testid: "t--start-from-data",
      title: createMessage(START_WITH_DATA_TITLE),
    },
    {
      onClick: onClickStartFromScratch,
      src: getAssetUrl(`${ASSETS_CDN_URL}/start-from-scratch.svg`),
      subTitle: createMessage(START_FROM_SCRATCH_SUBTITLE),
      testid: "t--start-from-scratch",
      title: createMessage(START_FROM_SCRATCH_TITLE),
    },
    {
      onClick: onClickStartFromTemplate,
      src: getAssetUrl(`${ASSETS_CDN_URL}/start-from-templates.svg`),
      subTitle: createMessage(START_FROM_TEMPLATE_SUBTITLE),
      testid: "t--start-from-template",
      title: createMessage(START_FROM_TEMPLATE_TITLE),
    },
  ];

  useEffect(() => {
    if (application) {
      urlBuilder.updateURLParams(
        {
          applicationSlug: application.slug,
          applicationVersion: application.applicationVersion,
          applicationId: application.id,
        },
        application.pages.map((page) => ({
          pageSlug: page.slug,
          customSlug: page.customSlug,
          pageId: page.id,
        })),
      );

      if (isEnabledForStartWithDataDefault) {
        onClickStartWithData();
      }
    }
  }, [application]);

  useEffect(() => {
    AnalyticsUtil.logEvent("ONBOARDING_CREATE_APP_FLOW", {
      totalOptions: selectionOptions.length,
    });

    return () => {
      resetCreateNewAppFlow();
    };
  }, []);

  const isBackButtonHidden =
    isEnabledForStartWithDataDefault &&
    (!createNewAppPluginId || !selectedDatasource);

  const onForkTemplateClick = (template: Template) => {
    const title = template.title;
    AnalyticsUtil.logEvent("FORK_TEMPLATE_WHEN_ONBOARDING", { title });
    // When fork template is clicked to add a new app using the template
    if (!isImportingTemplate && application) {
      dispatch(setActiveLoadingTemplateId(template.id));
      dispatch(
        importTemplateIntoApplicationViaOnboardingFlow(
          template.id,
          template.title,
          template.pages.map((p) => p.name),
          application.id,
          application.workspaceId,
        ),
      );
    }
  };

  return (
    <SectionWrapper isBannerVisible={!!isBannerVisible}>
      <BackWrapper hidden={!useType} isBannerVisible={!!isBannerVisible}>
        <LinkWrapper
          className="t--create-new-app-option-goback"
          data-testid="t--create-new-app-option-goback"
          hidden={isBackButtonHidden}
          onClick={onClickBackButton}
          startIcon="arrow-left-line"
        >
          {createMessage(GO_BACK)}
        </LinkWrapper>

        <LinkWrapper
          className="t--create-new-app-option-skip"
          data-testid="t--create-new-app-option-skip"
          endIcon="arrow-right-line"
          onClick={onClickSkipButton}
        >
          {createMessage(SKIP_START_WITH_USE_CASE_TEMPLATES)}
        </LinkWrapper>
      </BackWrapper>
      {isEnabledForStartWithDataDefault ? (
        renderStartWithData()
      ) : useType === START_WITH_TYPE.TEMPLATE ? (
        selectedTemplate ? (
          <TemplateView
            onClickUseTemplate={onClickUseTemplate}
            showBack={false}
            showSimilarTemplate={false}
            templateId={selectedTemplate}
          />
        ) : (
          <StartWithTemplatesWrapper
            onForkTemplateClick={onForkTemplateClick}
            setSelectedTemplate={setSelectedTemplate}
          />
        )
      ) : useType === START_WITH_TYPE.DATA ? (
        renderStartWithData()
      ) : (
        <OptionWrapper>
          <Text kind="heading-xl">
            {createMessage(CREATE_NEW_APPS_STEP_TITLE)}
          </Text>
          <Text>{createMessage(CREATE_NEW_APPS_STEP_SUBTITLE)}</Text>
          <CardsWrapper>
            {selectionOptions.map((option: CardProps) => (
              <Card key={option.testid} {...option} />
            ))}
          </CardsWrapper>
        </OptionWrapper>
      )}
    </SectionWrapper>
  );
};

export default CreateNewAppsOption;
