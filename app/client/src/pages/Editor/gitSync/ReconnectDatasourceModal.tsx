import React, { useCallback, useEffect, useState } from "react";

import {
  getImportedApplication,
  getIsDatasourceConfigForImportFetched,
  getWorkspaceIdForImport,
  getUserApplicationsWorkspacesList,
  getPageIdForImport,
} from "@appsmith/selectors/applicationSelectors";

import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";

import styled from "styled-components";
import { Title } from "./components/StyledComponents";
import {
  createMessage,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE1,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE2,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  SKIP_CONFIGURATION,
  SKIP_TO_APPLICATION,
  SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION,
} from "@appsmith/constants/messages";
import {
  getDatasourceLoading,
  getDatasourcePlugins,
  getDatasources,
  getIsDatasourceTesting,
  getIsListing,
  getIsReconnectingDatasourcesModalOpen,
  getUnconfiguredDatasources,
} from "selectors/entitiesSelector";
import {
  initDatasourceConnectionDuringImportRequest,
  resetDatasourceConfigForImportFetchedFlag,
  setIsReconnectingDatasourcesModalOpen,
  setPageIdForImport,
  setWorkspaceIdForImport,
} from "@appsmith/actions/applicationActions";
import type { Datasource } from "entities/Datasource";
import DatasourceForm from "../DataSourceEditor";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useQuery } from "../utils";
import ListItemWrapper from "./components/DatasourceListItem";
import { getDefaultPageId } from "@appsmith/sagas/ApplicationSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getOAuthAccessToken,
  loadFilePickerAction,
} from "actions/datasourceActions";
import { builderURL } from "RouteBuilder";
import localStorage from "utils/localStorage";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  toast,
  Button,
  Text,
} from "design-system";
import { keyBy } from "lodash";

const Section = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  width: calc(100% - 206px);
`;

const BodyContainer = styled.div`
  flex: 3;
  height: 640px;
  max-height: 82vh;
`;

// TODO: Removed usage of "t--" classes since they clash with the test classes.
const ContentWrapper = styled.div`
  height: calc(100% - 16px);
  display: flex;
  margin-top: 24px;
  border-top: 1px solid var(--ads-v2-color-border);
  padding-top: 16px;

  .t--json-to-form-wrapper {
    width: 100%;

    .t--collapse-section-container {
      margin-top: 20px;
    }

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
      width: 100%;

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
  height: inherit;
  overflow: auto;
  width: 256px;
  padding-right: 8px;

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
  text-align: center;
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
`;

const DBFormWrapper = styled.div`
  width: calc(100% - 206px);
  overflow: auto;
  display: flex;
  overflow: hidden;
  height: inherit;
  flex: 1;
  display: flex;
  border-left: 1px solid var(--ads-v2-color-border);
  border-right: 1px solid var(--ads-v2-color-border);
  margin-right: 12px;
  width: calc(100% - 256px - 256px);

  > div {
    width: 100%;
    height: calc(100% - 68px); // Adding height offset of the buttons container
  }
  div[class^="RestAPIDatasourceForm__RestApiForm-"] {
    padding-top: 0px;
    height: 100%;
  }

  .t--cancel-edit-datasource {
    display: none;
  }
`;

const ModalContentWrapper = styled(ModalContent)`
  width: 100%;
`;
const ModalBodyWrapper = styled(ModalBody)`
  overflow-y: hidden;
`;
const SkipToAppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 256px;
`;

enum AuthorizationStatus {
  SUCCESS = "success",
  APPSMITH_ERROR = "appsmith_error",
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
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsReconnectingDatasourcesModalOpen);
  const workspaceId = useSelector(getWorkspaceIdForImport);
  const pageIdForImport = useSelector(getPageIdForImport);
  const unconfiguredDatasources = useSelector(getUnconfiguredDatasources);
  const unconfiguredDatasourceIds = unconfiguredDatasources.map(
    (ds: Datasource) => ds.id,
  );
  let datasources = useSelector(getDatasources);
  datasources = datasources.filter((ds: Datasource) =>
    unconfiguredDatasourceIds.includes(ds.id),
  );
  const pluginsArray = useSelector(getDatasourcePlugins);
  const plugins = keyBy(pluginsArray, "id");
  const isLoading = useSelector(getIsListing);
  const isDatasourceTesting = useSelector(getIsDatasourceTesting);
  const isDatasourceUpdating = useSelector(getDatasourceLoading);

  // checking refresh modal
  const pendingApp = JSON.parse(
    localStorage.getItem("importedAppPendingInfo") || "null",
  );
  // getting query from redirection url
  const userWorkspaces = useSelector(getUserApplicationsWorkspacesList);
  const queryParams = useQuery();
  const queryAppId =
    queryParams.get("appId") || (pendingApp ? pendingApp.appId : null);
  const queryPageId =
    queryParams.get("pageId") || (pendingApp ? pendingApp.pageId : null);
  const queryDatasourceId =
    queryParams.get("datasourceId") ||
    (pendingApp ? pendingApp.datasourceId : null);
  const queryIsImport =
    queryParams.get("importForGit") === "true" || !!pendingApp;

  const [selectedDatasourceId, setSelectedDatasourceId] = useState<
    string | null
  >(queryDatasourceId);
  const [pageId, setPageId] = useState<string | null>(queryPageId);
  const [appId, setAppId] = useState<string | null>(queryAppId);
  const [appURL, setAppURL] = useState("");
  const [datasource, setDatasource] = useState<Datasource | null>(null);
  const [isImport, setIsImport] = useState(queryIsImport);
  const [isTesting, setIsTesting] = useState(false);
  const queryDS = datasources.find((ds) => ds.id === queryDatasourceId);
  const dsName = queryDS?.name;
  const orgId = queryDS?.workspaceId;
  let pluginName = "";
  if (!!queryDS?.pluginId) {
    pluginName = plugins[queryDS.pluginId]?.name;
  }

  // when redirecting from oauth, processing the status
  if (isImport) {
    setIsImport(false);
    const status = queryParams.get("response_status");
    const display_message = queryParams.get("display_message");
    if (status !== AuthorizationStatus.SUCCESS) {
      const message =
        status === AuthorizationStatus.APPSMITH_ERROR
          ? OAUTH_AUTHORIZATION_APPSMITH_ERROR
          : OAUTH_AUTHORIZATION_FAILED;
      toast.show(display_message || message, { kind: "error" });
      AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
        applicationId: queryAppId,
        datasourceId: queryDatasourceId,
        pageId: queryPageId,
        oAuthPassOrFailVerdict: status,
        workspaceId: orgId,
        datasourceName: dsName,
        pluginName: pluginName,
      });
    } else if (queryDatasourceId) {
      dispatch(loadFilePickerAction());
      dispatch(getOAuthAccessToken(queryDatasourceId));
    }
  }

  // should open reconnect datasource modal
  useEffect(() => {
    if (userWorkspaces && queryIsImport && queryDatasourceId) {
      if (queryAppId) {
        for (const ws of userWorkspaces) {
          const { applications, workspace } = ws;
          const application = applications.find(
            (app: any) => app.id === queryAppId,
          );
          if (application) {
            dispatch(setWorkspaceIdForImport(workspace.id));
            dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
            const defaultPageId = getDefaultPageId(application.pages);
            if (pageIdForImport) {
              setPageId(pageIdForImport);
            } else if (defaultPageId) {
              setPageId(defaultPageId);
            }
            if (!datasources.length) {
              dispatch({
                type: ReduxActionTypes.FETCH_UNCONFIGURED_DATASOURCE_LIST,
                payload: {
                  applicationId: appId,
                  workspaceId: workspace.id,
                },
              });
            }
            break;
          }
        }
      }
    }
  }, [userWorkspaces, queryIsImport]);

  const isConfigFetched = useSelector(getIsDatasourceConfigForImportFetched);

  // todo uncomment this to fetch datasource config
  useEffect(() => {
    if (isModalOpen && workspaceId) {
      dispatch(
        initDatasourceConnectionDuringImportRequest(workspaceId as string),
      );
    }
  }, [workspaceId, isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      // while updating datasource, testing flag should be false
      if (isDatasourceUpdating) {
        setIsTesting(false);
      }
      // while testing datasource, testing flag should be true
      if (isDatasourceTesting) {
        setIsTesting(true);
      }
    }
  }, [isModalOpen, isDatasourceTesting, isDatasourceUpdating]);

  const handleClose = (e: any) => {
    // Some magic code to handle the scenario where the reconnect modal and google sheets
    // file picker are both open.
    // Check if the overlay of the modal was clicked
    function isOverlayClicked(classList: DOMTokenList) {
      return classList.contains("reconnect-datasource-modal");
    }
    // Check if the close button of the modal was clicked
    function isCloseButtonClicked(e: HTMLDivElement) {
      const dialogCloseButton = document.querySelector(
        ".ads-v2-modal__content-header-close-button",
      );
      if (dialogCloseButton) {
        return dialogCloseButton.contains(e);
      }
      return false;
    }

    let shouldClose = false;
    if (e) {
      shouldClose = isOverlayClicked(e.target.classList);
      shouldClose = shouldClose || isCloseButtonClicked(e.target);
      // If either the close button or the overlay was clicked close the modal
      if (shouldClose) {
        onClose();
      }
    }
  };

  const onClose = () => {
    localStorage.setItem("importedAppPendingInfo", "null");
    dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: false }));
    dispatch(setWorkspaceIdForImport(""));
    dispatch(setPageIdForImport(""));
    dispatch(resetDatasourceConfigForImportFetchedFlag());
    setSelectedDatasourceId("");
  };

  const onSelectDatasource = useCallback((ds: Datasource) => {
    setIsTesting(false);
    setSelectedDatasourceId(ds.id);
    setDatasource(ds);
    AnalyticsUtil.logEvent("RECONNECTING_DATASOURCE_ITEM_CLICK", {
      id: ds.id,
      name: ds.name,
      pluginName: plugins[ds.id]?.name,
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

  const importedApplication = useSelector(getImportedApplication);
  useEffect(() => {
    if (!queryIsImport) {
      // @ts-expect-error: importedApplication is of type unknown
      const defaultPage = importedApplication?.pages?.find(
        (page: any) => page.isDefault,
      );
      if (defaultPage) {
        setPageId(defaultPage.id);
        // @ts-expect-error: importedApplication is of type unknown
        setAppId(importedApplication?.id);
      }
    }
  }, [importedApplication, queryIsImport]);

  useEffect(() => {
    if (pageId && appId && datasources.length) {
      // TODO: Update route params here
      setAppURL(
        builderURL({
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
          if (index > -1 && !datasources[index].isConfigured) {
            return;
          }
          next = datasources
            .slice(index + 1)
            .find((ds: Datasource) => !ds.isConfigured);
        }
        next = next || pending[0];
        setSelectedDatasourceId(next.id);
        setDatasource(next);
        // when refresh, it should be opened.
        const appInfo = {
          appId: appId,
          pageId: pageId,
          datasourceId: next.id,
        };
        localStorage.setItem("importedAppPendingInfo", JSON.stringify(appInfo));
      } else if (appURL) {
        // open application import successfule
        localStorage.setItem("importApplicationSuccess", "true");
        localStorage.setItem("importedAppPendingInfo", "null");
        window.open(appURL, "_self");
      }
    }
  }, [datasources, appURL, isModalOpen, isTesting, queryIsImport]);

  const mappedDataSources = datasources.map((ds: Datasource) => {
    return (
      <ListItemWrapper
        ds={ds}
        key={ds.id}
        onClick={() => {
          onSelectDatasource(ds);
        }}
        plugin={plugins[ds.pluginId]}
        selected={ds.id === selectedDatasourceId}
      />
    );
  });

  const shouldShowDBForm =
    isConfigFetched && !isLoading && !datasource?.isConfigured;

  return (
    <Modal open={isModalOpen}>
      <ModalContentWrapper
        data-testid="reconnect-datasource-modal"
        onClick={handleClose}
        onEscapeKeyDown={onClose}
        onInteractOutside={handleClose}
        overlayClassName="reconnect-datasource-modal"
      >
        <ModalHeader>Reconnect datasources</ModalHeader>
        <ModalBodyWrapper>
          <BodyContainer>
            <Title>
              {createMessage(RECONNECT_MISSING_DATASOURCE_CREDENTIALS)}
            </Title>

            <Text>
              {createMessage(
                RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
              )}
            </Text>
            <ContentWrapper>
              <ListContainer>{mappedDataSources}</ListContainer>

              <DBFormWrapper>
                {shouldShowDBForm && (
                  <DatasourceForm
                    applicationId={appId}
                    datasourceId={selectedDatasourceId}
                    fromImporting
                    // isInsideReconnectModal: indicates that the datasource form is rendering inside reconnect modal
                    isInsideReconnectModal
                    pageId={pageId}
                  />
                )}
                {datasource?.isConfigured && SuccessMessages()}
              </DBFormWrapper>

              <SkipToAppWrapper>
                <Text kind="heading-s">
                  {createMessage(SKIP_CONFIGURATION)}
                </Text>
                <Text>
                  {createMessage(SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION)}
                </Text>
                <Button
                  UNSAFE_width={"100px"}
                  className="t--skip-to-application-btn mt-5"
                  href={appURL}
                  kind="secondary"
                  onClick={() => {
                    AnalyticsUtil.logEvent(
                      "RECONNECTING_SKIP_TO_APPLICATION_BUTTON_CLICK",
                    );
                    localStorage.setItem("importedAppPendingInfo", "null");
                  }}
                  renderAs="a"
                  size="md"
                >
                  {createMessage(SKIP_TO_APPLICATION)}
                </Button>
              </SkipToAppWrapper>
            </ContentWrapper>
          </BodyContainer>
        </ModalBodyWrapper>
      </ModalContentWrapper>
    </Modal>
  );
}

export default ReconnectDatasourceModal;
