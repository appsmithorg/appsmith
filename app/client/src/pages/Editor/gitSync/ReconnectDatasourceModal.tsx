import React, { useEffect, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import { getOrganizationIdForImport } from "selectors/gitSyncSelectors";
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
  createMessage,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
} from "constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import {
  getDatasources,
  getIsReconnectingDatasourcesModalOpen,
  getPluginImages,
  getPluginNames,
} from "selectors/entitiesSelector";
import { setIsReconnectingDatasourcesModalOpen } from "actions/metaActions";
import { Datasource } from "entities/Datasource";
import { PluginImage } from "../DataSourceEditor/JSONtoForm";
import DBForm from "../DataSourceEditor/DBForm";

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
`;

const ContentWrapper = styled.div`
  height: calc(100% - 76px);
  display: flex;
  margin-left: -${(props) => props.theme.spaces[8]}px;
`;

const ListContainer = styled.div`
  height: 100%;
  overflow: auto;
  width: 206px;
`;

const ListItem = styled.div`
  display: flex;
  height: 64px;
  width: 100%;
  padding: 10px 18px;
  margin-bottom: 10px;
  cursor: pointer;
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
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ButtonContainer = styled.div<{ topMargin: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.topMargin]}px`};
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

function ReconnectDatasourceModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsReconnectingDatasourcesModalOpen);
  const organizationId = useSelector(getOrganizationIdForImport);
  const handleClose = useCallback(() => {
    dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: false }));
  }, [dispatch, setIsReconnectingDatasourcesModalOpen]);

  const dataSources = useSelector(getDatasources);
  const pluginImages = useSelector(getPluginImages);
  const pluginNames = useSelector(getPluginNames);
  const [
    selectedDatasource,
    setSelectedDatasource,
  ] = useState<Datasource | null>(null);

  useEffect(() => {
    if (!selectedDatasource && dataSources.length) {
      setSelectedDatasource(dataSources[0]);
    }
  }, [selectedDatasource, dataSources]);

  const menuOptions = [
    {
      key: "RECONNECT_DATASOURCES",
      title: "Reconnect Datasources",
    },
  ];

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
                {dataSources.map((ds: Datasource) => {
                  return (
                    <ListItem
                      className={`t--ds-list ${
                        ds.id === selectedDatasource?.id ? "active" : ""
                      }`}
                      key={ds.id}
                      onClick={() => setSelectedDatasource(ds)}
                    >
                      <PluginImage
                        alt="Datasource"
                        src={pluginImages[ds.pluginId]}
                      />
                      <ListLabels>
                        <Text
                          color={Colors.GRAY_800}
                          style={{ marginBottom: 2 }}
                          type={TextType.H4}
                        >
                          {pluginNames[ds.pluginId]}
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
                })}
              </ListContainer>
              <DBForm />
            </ContentWrapper>
            <ButtonContainer topMargin={10}>
              <Button
                category={Category.primary}
                className="t--add-credential-button"
                // onClick={() => generateSSHKey()}
                size={Size.large}
                tag="button"
                text="Add credentials"
              />
            </ButtonContainer>
          </BodyContainer>
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
