import React, { useEffect, useState } from "react";
import Dialog from "components/ads/DialogComponent";

import {
  getOrganizationIdForImport,
  getImportedApplication,
  getIsDatasourceConfigForImportFetched,
} from "selectors/applicationSelectors";

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import TabMenu from "./Menu";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { Title } from "./components/StyledComponents";
import {
  ADD_MISSING_DATASOURCES,
  createMessage,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE1,
  RECONNECT_DATASOURCE_SUCCESS_MESSAGE2,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  SKIP_TO_APPLICATION,
  SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION,
  SKIP_TO_APPLICATION_TOOLTIP_HEADER,
} from "constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import {
  getDatasources,
  getIsReconnectingDatasourcesModalOpen,
  getPluginImages,
  getPluginNames,
  getUnconfiguredDatasources,
} from "selectors/entitiesSelector";
import {
  resetDatasourceConfigForImportFetchedFlag,
  setIsReconnectingDatasourcesModalOpen,
} from "actions/applicationActions";
import { Datasource } from "entities/Datasource";
import { PluginImage } from "../DataSourceEditor/JSONtoForm";
import { initDatasourceConnectionDuringImportRequest } from "actions/applicationActions";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { initialize } from "redux-form";
import { setUnconfiguredDatasourcesDuringImport } from "actions/datasourceActions";
import Collapsible from "../DataSourceEditor/Collapsible";
import Link from "./components/Link";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import TooltipComponent from "components/ads/Tooltip";
import { BUILDER_PAGE_URL } from "constants/routes";
import { setOrgIdForImport } from "actions/applicationActions";
import DatasourceForm from "../DataSourceEditor";

const Container = styled.div`
  height: 804px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px 10px 0px 0px;
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
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
    width: calc(100% - 206px);
    .t--close-editor {
      display: none;
    }
    div[class^="JSONtoForm__DBForm-"] {
      padding-top: 0px;

      div[class^="JSONtoForm__SaveButtonContainer-"] {
        width: 816px;
        button:first-child {
          display: none;
        }
      }
    }
    .t--collapse-top-border {
      height: 1px;
      width: 816px;
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

    .t--form-control-DROP_DOWN > div {
      width: 566px !important;
      & > div {
        width: 566px !important;
      }
    }

    .t--form-control-KEYVALUE_ARRAY > div {
      & > div {
        width: 566px !important;
        &:last-child {
          width: 140px !important;
        }
      }
    }

    .t--form-control-INPUT_TEXT > div {
      width: 566px !important;
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
      width: 566px !important;
      &:last-child {
        width: 140px !important;
      }
    }
  }

  .t--message-container {
    display: flex;
    flex-direction: column;
    width: 100%;
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

const ListItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  height: 64px;
  width: 100%;
  padding: 10px 18px;
  margin-bottom: 10px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
  &.active,
  &:hover {
    background-color: ${Colors.GEYSER_LIGHT};
  }
  img {
    width: 24pxx;
    height: 22.5px;
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ListLabels = styled.div`
  display: flex;
  flex-direction: column;
  .t--ds-list-description {
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  .cs-icon {
    margin-right: ${(props) => props.theme.spaces[2]}px;
    margin-top: -${(props) => props.theme.spaces[1]}px;
  }
`;

enum DSCollapseMenu {
  CONFIGURED = "CONFIGURED",
  UNCONFIGURED = "UNCONFIGURED",
}

function ListItemWrapper(props: {
  ds: Datasource;
  selected?: boolean;
  isConfigured?: boolean;
  plugin: {
    image: string;
    name: string;
  };
  onClick: (ds: Datasource, isConfigured?: boolean) => void;
}) {
  const { ds, isConfigured, onClick, plugin, selected } = props;
  return (
    <ListItem
      className={`t--ds-list ${selected ? "active" : ""}`}
      disabled={isConfigured}
      onClick={() => onClick(ds, isConfigured)}
    >
      <PluginImage alt="Datasource" src={plugin.image} />
      <ListLabels>
        <Text
          color={Colors.GRAY_800}
          style={{ marginBottom: 2 }}
          type={TextType.H4}
        >
          {plugin.name}
        </Text>
        <Text
          className="t--ds-list-description"
          color={Colors.GRAY_700}
          type={TextType.H5}
        >
          {ds.name}
        </Text>
      </ListLabels>
    </ListItem>
  );
}

function TooltipContent() {
  return (
    <TooltipWrapper>
      <Text color={Colors.WHITE} style={{ display: "flex" }} type={TextType.P3}>
        <Icon
          fillColor={Colors.YELLOW_LIGHT}
          name="alert-fill"
          size={IconSize.LARGE}
        />
        {createMessage(SKIP_TO_APPLICATION_TOOLTIP_HEADER)}
      </Text>
      <Text color={Colors.WHITE} type={TextType.P3}>
        {createMessage(SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION)}
      </Text>
    </TooltipWrapper>
  );
}

function ReconnectDatasourceModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsReconnectingDatasourcesModalOpen);
  const organizationId = useSelector(getOrganizationIdForImport);
  const datasources = useSelector(getDatasources);
  const unconfiguredDatasources = useSelector(getUnconfiguredDatasources);
  const pluginImages = useSelector(getPluginImages);
  const pluginNames = useSelector(getPluginNames);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<
    string | null
  >(null);
  const [availableDatasources, setAvailableDatasources] = useState<
    Array<Datasource>
  >([]);
  const [pageId, setPageId] = useState("");
  const [appURL, setAppURL] = useState("");
  const [collapsedMenu, setCollapsedMenu] = useState(
    DSCollapseMenu.UNCONFIGURED,
  );
  const isConfigFetched = useSelector(getIsDatasourceConfigForImportFetched);

  // todo uncomment this to fetch datasource config
  useEffect(() => {
    if (isModalOpen && organizationId) {
      dispatch(
        initDatasourceConnectionDuringImportRequest(organizationId as string),
      );
    }
  }, [organizationId, isModalOpen]);

  const handleClose = useCallback(() => {
    dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: false }));
    dispatch(setOrgIdForImport(""));
    dispatch(resetDatasourceConfigForImportFetchedFlag());
    dispatch(setUnconfiguredDatasourcesDuringImport());
    setSelectedDatasourceId("");
  }, [dispatch, setIsReconnectingDatasourcesModalOpen, isModalOpen]);

  const onSelectDatasource = useCallback(
    (ds: Datasource, isConfigured?: boolean) => {
      setSelectedDatasourceId(ds.id);
      setCollapsedMenu(
        isConfigured ? DSCollapseMenu.CONFIGURED : DSCollapseMenu.UNCONFIGURED,
      );
    },
    [],
  );

  useEffect(() => {
    if (
      isConfigFetched &&
      datasources &&
      unconfiguredDatasources &&
      unconfiguredDatasources[0] &&
      !selectedDatasourceId
    ) {
      setSelectedDatasourceId(unconfiguredDatasources[0].id);
    }
  }, [isConfigFetched, selectedDatasourceId, unconfiguredDatasources]);

  useEffect(() => {
    const selectedDatasourceConfig = datasources.find(
      (datasource: Datasource) => datasource.id === selectedDatasourceId,
    );
    dispatch(initialize(DATASOURCE_DB_FORM, selectedDatasourceConfig));
  }, [selectedDatasourceId]);

  const menuOptions = [
    {
      key: "RECONNECT_DATASOURCES",
      title: "Reconnect Datasources",
    },
  ];

  useEffect(() => {
    setAvailableDatasources(
      datasources.filter((ds: Datasource) => {
        const index = unconfiguredDatasources.findIndex(
          (uds: Datasource) => uds.id === ds.id,
        );
        return index < 0;
      }),
    );
  }, [datasources, unconfiguredDatasources]);

  const importedApplication = useSelector(getImportedApplication);
  useEffect(() => {
    const defaultPage = importedApplication?.pages?.find(
      (page: any) => page.isDefault,
    );
    if (defaultPage) {
      setPageId(defaultPage.id);
      setAppURL(
        BUILDER_PAGE_URL({
          applicationId: importedApplication?.id,
          pageId: defaultPage.id,
        }),
      );
    }
  }, [importedApplication]);

  return (
    <>
      <Dialog
        canEscapeKeyClose
        canOutsideClickClose
        className={Classes.GIT_IMPORT_MODAL}
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
              <ListContainer>
                <Collapsible
                  defaultIsOpen={collapsedMenu === DSCollapseMenu.CONFIGURED}
                  headerIcon={{
                    name: "oval-check",
                    color: Colors.GREEN,
                  }}
                  title="Available Datasources"
                >
                  {availableDatasources.map((ds: Datasource) => {
                    return (
                      <ListItemWrapper
                        ds={ds}
                        isConfigured
                        key={ds.id}
                        onClick={onSelectDatasource}
                        plugin={{
                          name: pluginNames[ds.pluginId],
                          image: pluginImages[ds.pluginId],
                        }}
                        selected={ds.id === selectedDatasourceId}
                      />
                    );
                  })}
                </Collapsible>
                <Collapsible
                  defaultIsOpen={collapsedMenu === DSCollapseMenu.UNCONFIGURED}
                  headerIcon={{
                    name: "warning-line",
                    color: Colors.WARNING_SOLID,
                  }}
                  title="Missing Datasources"
                >
                  {unconfiguredDatasources.map((ds: Datasource) => {
                    return (
                      <ListItemWrapper
                        ds={ds}
                        key={ds.id}
                        onClick={onSelectDatasource}
                        plugin={{
                          name: pluginNames[ds.pluginId],
                          image: pluginImages[ds.pluginId],
                        }}
                        selected={ds.id === selectedDatasourceId}
                      />
                    );
                  })}
                </Collapsible>
              </ListContainer>
              {isConfigFetched &&
                collapsedMenu === DSCollapseMenu.UNCONFIGURED && (
                  <DatasourceForm
                    applicationId={importedApplication?.id}
                    datasourceId={selectedDatasourceId}
                    fromImporting
                    pageId={pageId}
                  />
                )}
              {collapsedMenu === DSCollapseMenu.CONFIGURED && (
                <Section className="t--message-container">
                  <Message>
                    {createMessage(RECONNECT_DATASOURCE_SUCCESS_MESSAGE1)}
                  </Message>
                  <Message>
                    {createMessage(RECONNECT_DATASOURCE_SUCCESS_MESSAGE2)}
                  </Message>
                  <Link
                    color={Colors.GREY_9}
                    hasIcon
                    link={DOCS_BASE_URL || ""}
                    onClick={() => {
                      const ds = datasources[0];
                      if (ds) {
                        setSelectedDatasourceId(ds.id);
                        setCollapsedMenu(DSCollapseMenu.UNCONFIGURED);
                      }
                    }}
                    text={createMessage(ADD_MISSING_DATASOURCES)}
                  />
                </Section>
              )}
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
                className="t--application-edit-link"
                href={appURL}
                size={Size.medium}
                text={createMessage(SKIP_TO_APPLICATION)}
              />
            </TooltipComponent>
          </SkipToAppButtonWrapper>
          <CloseBtnContainer onClick={handleClose}>
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
