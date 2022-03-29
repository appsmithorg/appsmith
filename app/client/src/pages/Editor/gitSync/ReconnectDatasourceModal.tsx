import React, { useCallback, useEffect, useState } from "react";
import Dialog from "components/ads/DialogComponent";

import {
  getImportedApplication,
  getIsDatasourceConfigForImportFetched,
  getOrganizationIdForImport,
  getUserApplicationsOrgsList,
} from "selectors/applicationSelectors";

import { useDispatch, useSelector } from "react-redux";
import TabMenu from "./Menu";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import _, { get } from "lodash";
import { Title } from "./components/StyledComponents";
import {
  createMessage,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE1,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE2,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  SKIP_TO_APPLICATION,
  SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION,
} from "@appsmith/constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import {
  getDatasourceDrafts,
  getIsDatasourceTesting,
  getIsListing,
  getIsReconnectingDatasourcesModalOpen,
  getPluginImages,
  getPluginNames,
  getUnconfiguredDatasources,
} from "selectors/entitiesSelector";
import {
  ApplicationVersion,
  initDatasourceConnectionDuringImportRequest,
  resetDatasourceConfigForImportFetchedFlag,
  setIsReconnectingDatasourcesModalOpen,
  setOrgIdForImport,
} from "actions/applicationActions";
import { Datasource } from "entities/Datasource";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { initialize } from "redux-form";
import TooltipComponent from "components/ads/Tooltip";
import DatasourceForm from "../DataSourceEditor";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useQuery } from "../utils";
import ListItemWrapper from "./components/DatasourceListItem";
import { getDefaultPageId } from "sagas/ApplicationSagas";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Toaster, Variant } from "components/ads";
import { getOAuthAccessToken } from "actions/datasourceActions";
import { builderURL } from "RouteBuilder";

const Container = styled.div`
  height: 765px;
  max-height: 82vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px 10px 0px 0px;
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  width: calc(100% - 206px);
`;

const BodyContainer = styled.div`
  flex: 3;
  height: calc(100% - ${MENU_HEIGHT}px);
  padding-left: ${(props) => props.theme.spaces[8]}px;
`;

const TabsContainer = styled.div`
  height: ${MENU_HEIGHT}px;
  padding-left: ${(props) => props.theme.spaces[8]}px;

  .react-tabs {
    width: 1029px;
  }
`;

const ContentWrapper = styled.div`
  height: calc(100% - 76px);
  display: flex;
  margin-left: -${(props) => props.theme.spaces[8]}px;

  .t--json-to-form-wrapper {
    width: 100%;

    .t--close-editor {
      display: none;
    }

    div[class^="JSONtoForm__DBForm-"] {
      padding-top: 0px;

      div[class^="JSONtoForm__SaveButtonContainer-"] {
        button:first-child {
          display: none;
        }
      }
    }

    .t--collapse-top-border {
      height: 1px;
      margin-top: ${(props) => props.theme.spaces[10]}px;
      margin-bottom: ${(props) => props.theme.spaces[10]}px;

      &:first-child {
        display: none;
      }
    }

    .t--collapse-section-container {
      width: 816px;

      & > div {
        color: ${Colors.BLACK};
      }
    }

    .label-icon-wrapper div[class^="IconConstants__IconWrapper-"] {
      width: 12px;
      height: 14px;
      margin-left: 6px;
      margin-right: 6px;

      svg {
        width: 12px;
        height: 14px;

        path {
          fill: ${Colors.GREEN};
        }
      }
    }

    div > label[class^="StyledFormComponents__StyledFormLabel-"] {
      &:last-child {
        width: 140px !important;
      }
    }
  }

  .t--message-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const ListContainer = styled.div`
  height: 100%;
  overflow: auto;
  width: 206px;

  .t--collapse-top-border {
    display: none;
  }

  .t--collapse-section-container {
    width: 90%;
    margin-left: 5%;
    margin-bottom: ${(props) => props.theme.spaces[11] + 2}px;

    & > div {
      font-style: normal;
      font-weight: normal;
      font-size: 12px;
      line-height: 16px;
      color: ${Colors.BLACK};
    }
  }
`;

const Message = styled.div`
  font-size: ${(props) => props.theme.typography["p0"].fontSize}px;
  line-height: ${(props) => props.theme.typography["p0"].lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography["p0"].letterSpacing}px;
  color: ${Colors.GREY_9};
  text-align: center;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => -props.theme.spaces[4]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

const SkipToAppButtonWrapper = styled.div`
  position: absolute;
  right: 0px;
  top: ${(props) => props.theme.spaces[11]}px;

  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[7] - 1}px`};
`;

const TooltipWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 320px;
`;

const DBFormWrapper = styled.div`
  padding: 10px;
  width: calc(100% - 206px);
  overflow: auto;

  div[class^="RestAPIDatasourceForm__RestApiForm-"] {
    padding-top: 0px;
    height: 100%;
  }

  .t--delete-datasource {
    display: none;
  }
`;

enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
}

function TooltipContent() {
  return (
    <TooltipWrapper>
      <Text
        color={Colors.WHITE}
        style={{ marginBottom: "4px" }}
        type={TextType.P3}
      >
        {createMessage(SKIP_TO_APPLICATION)}
      </Text>
      <Text color={Colors.WHITE} type={TextType.P3}>
        {createMessage(SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION)}
      </Text>
    </TooltipWrapper>
  );
}

function SuccessMessages() {
  return (
    <Section className="t--message-container">
      <Message>{createMessage(RECONNECT_DATASOURCE_SUCCESS_MESSAGE1)}</Message>
      <Message>{createMessage(RECONNECT_DATASOURCE_SUCCESS_MESSAGE2)}</Message>
    </Section>
  );
}

function ReconnectDatasourceModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsReconnectingDatasourcesModalOpen);
  const organizationId = useSelector(getOrganizationIdForImport);
  const datasources = useSelector(getUnconfiguredDatasources);
  const pluginImages = useSelector(getPluginImages);
  const pluginNames = useSelector(getPluginNames);
  const datasourceDrafts = useSelector(getDatasourceDrafts);
  const isLoading = useSelector(getIsListing);
  const isDatasourceTesting = useSelector(getIsDatasourceTesting);

  // getting query from redirection url
  const userOrgs = useSelector(getUserApplicationsOrgsList);
  const queryParams = useQuery();
  const queryAppId = queryParams.get("appId");
  const queryPageId = queryParams.get("pageId");
  const queryDatasourceId = queryParams.get("datasourceId");
  const queryIsImport = JSON.parse(queryParams.get("importForGit") ?? "false");

  const [selectedDatasourceId, setSelectedDatasourceId] = useState<
    string | null
  >(queryDatasourceId);
  const [pageId, setPageId] = useState<string | null>(queryPageId);
  const [appId, setAppId] = useState<string | null>(queryAppId);
  const [appURL, setAppURL] = useState("");
  const [datasouce, setDatasource] = useState<Datasource | null>(null);
  const [isImport, setIsImport] = useState(queryIsImport);
  const [isTesting, setIsTesting] = useState(false);

  // when redirecting from oauth, processing the status
  if (isImport) {
    setIsImport(false);
    const status = queryParams.get("response_status");
    const display_message = queryParams.get("display_message");
    const variant = Variant.danger;

    if (status !== AuthorizationStatus.SUCCESS) {
      const message =
        status === AuthorizationStatus.APPSMITH_ERROR
          ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
          : OAUTH_AUTHORIZATION_FAILED;
      Toaster.show({ text: display_message || message, variant });
    } else if (queryDatasourceId) {
      dispatch(getOAuthAccessToken(queryDatasourceId));
    }
    AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
      queryAppId,
      queryDatasourceId,
      queryPageId,
    });
  }

  // should open reconnect datasource modal
  useEffect(() => {
    if (userOrgs && queryIsImport && queryDatasourceId) {
      if (queryAppId) {
        for (const org of userOrgs) {
          const { applications, organization } = org;
          const application = applications.find(
            (app: any) => app.id === queryAppId,
          );
          if (application) {
            dispatch(setOrgIdForImport(organization.id));
            dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
            const defaultPageId = getDefaultPageId(application.pages);
            if (defaultPageId) {
              setPageId(defaultPageId);
            }
            if (!datasources.length) {
              dispatch({
                type: ReduxActionTypes.FETCH_UNCONFIGURED_DATASOURCE_LIST,
                payload: {
                  applicationId: appId,
                  orgId: organization.id,
                },
              });
            }
            break;
          }
        }
      }
    }
  }, [userOrgs, queryIsImport]);

  const isConfigFetched = useSelector(getIsDatasourceConfigForImportFetched);

  // todo uncomment this to fetch datasource config
  useEffect(() => {
    if (isModalOpen && organizationId) {
      dispatch(
        initDatasourceConnectionDuringImportRequest(organizationId as string),
      );
    }
  }, [organizationId, isModalOpen]);

  useEffect(() => {
    if (isModalOpen && isDatasourceTesting) {
      setIsTesting(true);
    }
  }, [isModalOpen, isDatasourceTesting]);

  const handleClose = useCallback(() => {
    dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: false }));
    dispatch(setOrgIdForImport(""));
    dispatch(resetDatasourceConfigForImportFetchedFlag());
    setSelectedDatasourceId("");
  }, [dispatch, setIsReconnectingDatasourcesModalOpen, isModalOpen]);

  const onSelectDatasource = useCallback((ds: Datasource) => {
    setIsTesting(false);
    setSelectedDatasourceId(ds.id);
    setDatasource(ds);
    AnalyticsUtil.logEvent("RECONNECTING_DATASOURCE_ITEM_CLICK", {
      id: ds.id,
      name: ds.name,
      pluginName: pluginNames[ds.id],
      isConfigured: ds.isConfigured,
    });
  }, []);

  useEffect(() => {
    if (
      isConfigFetched &&
      datasources &&
      !selectedDatasourceId &&
      !queryIsImport
    ) {
      setDatasource(datasources[0]);
      setSelectedDatasourceId(datasources[0].id ?? "");
    }
  }, [isConfigFetched, selectedDatasourceId, queryIsImport]);

  useEffect(() => {
    const id = selectedDatasourceId;
    if (id) {
      const config = datasources.find(
        (datasource: Datasource) => datasource.id === id,
      );
      const notConfigured = config && !config.isConfigured;
      if (notConfigured) {
        const data = id in datasourceDrafts ? datasourceDrafts[id] : config;

        dispatch(initialize(DATASOURCE_DB_FORM, _.omit(data, ["name"])));
      }
    }
  }, [selectedDatasourceId]);

  const menuOptions = [
    {
      key: "RECONNECT_DATASOURCES",
      title: "Reconnect Datasources",
    },
  ];

  const importedApplication = useSelector(getImportedApplication);
  useEffect(() => {
    if (!queryIsImport) {
      const defaultPage = importedApplication?.pages?.find(
        (page: any) => page.isDefault,
      );
      if (defaultPage) {
        setPageId(defaultPage.id);
        setAppId(importedApplication?.id);
      }
    }
  }, [importedApplication, queryIsImport]);

  useEffect(() => {
    if (pageId && appId && datasources.length) {
      setAppURL(
        builderURL({
          applicationVersion:
            importedApplication?.applicationVersion ??
            ApplicationVersion.SLUG_URL,
          applicationSlug: importedApplication?.slug,
          applicationId: appId,
          pageId: pageId,
        }),
      );
    }
  }, [pageId, appId, datasources]);

  // checking of full configured
  useEffect(() => {
    if (isModalOpen && !isTesting) {
      const id = selectedDatasourceId;
      const pending = datasources.filter((ds: Datasource) => !ds.isConfigured);
      if (pending.length > 0) {
        let next: Datasource | undefined = undefined;
        if (id) {
          const index = datasources.findIndex((ds: Datasource) => ds.id === id);
          next = datasources
            .slice(index + 1)
            .find((ds: Datasource) => !ds.isConfigured);
        }
        next = next || pending[0];
        setSelectedDatasourceId(next.id);
        setDatasource(next);
      } else if (appURL) {
        window.open(appURL, "_self");
      }
    }
  }, [datasources, appURL, isModalOpen, isTesting]);

  const mappedDataSources = datasources.map((ds: Datasource) => {
    return (
      <ListItemWrapper
        ds={ds}
        key={ds.id}
        onClick={() => {
          onSelectDatasource(ds);
        }}
        plugin={{
          name: pluginNames[ds.pluginId],
          image: pluginImages[ds.pluginId],
        }}
        selected={ds.id === selectedDatasourceId}
      />
    );
  });

  const shouldShowDBForm =
    isConfigFetched && !isLoading && !datasouce?.isConfigured;
  const shouldShowSuccessMessages = datasouce && datasouce.isConfigured;

  return (
    <>
      <Dialog
        canEscapeKeyClose
        canOutsideClickClose
        className={Classes.RECONNECT_DATASOURCE_MODAL}
        isOpen={isModalOpen}
        maxWidth={"1300px"}
        onClose={handleClose}
        width={"1293px"}
      >
        <Container>
          <TabsContainer>
            <TabMenu
              activeTabIndex={0}
              onSelect={() => undefined}
              options={menuOptions}
            />
          </TabsContainer>
          <BodyContainer>
            <Title>
              {createMessage(RECONNECT_MISSING_DATASOURCE_CREDENTIALS)}
            </Title>
            <Section>
              <Text color={Colors.BLACK} type={TextType.P1}>
                {createMessage(
                  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
                )}
              </Text>
            </Section>
            <ContentWrapper>
              <ListContainer>{mappedDataSources}</ListContainer>
              {shouldShowDBForm && (
                <DBFormWrapper>
                  <DatasourceForm
                    applicationId={appId}
                    datasourceId={selectedDatasourceId}
                    fromImporting
                    pageId={pageId}
                  />
                </DBFormWrapper>
              )}
              {shouldShowSuccessMessages && SuccessMessages()}
            </ContentWrapper>
          </BodyContainer>
          <SkipToAppButtonWrapper>
            <TooltipComponent
              boundary="viewport"
              content={<TooltipContent />}
              maxWidth="320px"
              position="bottom-right"
            >
              <Button
                category={Category.tertiary}
                className="t--skip-to-application-btn"
                href={appURL}
                onClick={() => {
                  AnalyticsUtil.logEvent(
                    "RECONNECTING_SKIP_TO_APPLICATION_BUTTON_CLICK",
                  );
                }}
                size={Size.medium}
                text={createMessage(SKIP_TO_APPLICATION)}
              />
            </TooltipComponent>
          </SkipToAppButtonWrapper>
          <CloseBtnContainer
            className="t--reconnect-close-btn"
            onClick={handleClose}
          >
            <Icon
              fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
              name="close-modal"
              size={IconSize.XXXXL}
            />
          </CloseBtnContainer>
        </Container>
      </Dialog>
      <GitErrorPopup />
    </>
  );
}

export default ReconnectDatasourceModal;
