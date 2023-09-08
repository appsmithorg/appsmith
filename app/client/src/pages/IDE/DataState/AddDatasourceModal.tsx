import React, { useEffect, useRef } from "react";
import { Button, Modal, ModalBody, ModalContent, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { getCurrentApplication } from "../../../selectors/editorSelectors";
import styled from "styled-components";
import { thinScrollbar } from "../../../constants/DefaultTheme";
import scrollIntoView from "scroll-into-view-if-needed";
import NewApiScreen from "../../Editor/IntegrationEditor/NewApi";
import MockDataSources from "../../Editor/IntegrationEditor/MockDataSources";
import NewQueryScreen from "../../Editor/IntegrationEditor/NewQuery";
import { getMockDatasources } from "../../../selectors/entitiesSelector";
import { showAddDatasourceModalSelector } from "../ideSelector";
import { showAddDatasourceModal } from "../ideActions";

const NewIntegrationsContainer = styled.div`
  ${thinScrollbar};
  overflow: auto;
  flex: 1;
  & > div {
    margin-bottom: 20px;
  }
`;

interface MockDataSourcesProps {
  active: boolean;
}

function UseMockDatasources({ active }: MockDataSourcesProps) {
  const mockDatasources = useSelector(getMockDatasources);
  const useMockRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  useEffect(() => {
    if (active && useMockRef.current) {
      isMounted.current &&
        scrollIntoView(useMockRef.current, {
          behavior: "smooth",
          scrollMode: "always",
          block: "start",
          boundary: document.getElementById("new-integrations-wrapper"),
        });
    } else {
      isMounted.current = true;
    }
  }, [active]);
  return (
    <div id="mock-database" ref={useMockRef}>
      <Text kind="heading-s">Get started with our sample datasources</Text>
      <MockDataSources mockDatasources={mockDatasources} />
    </div>
  );
}

function CreateNewAPI({
  active,
  history,
  isCreating,
  pageId,
  showUnsupportedPluginDialog,
}: any) {
  const newAPIRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (active && newAPIRef.current) {
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
  }, [active]);
  return (
    <div id="new-api" ref={newAPIRef}>
      <Text kind="heading-s">APIs</Text>
      <NewApiScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showSaasAPIs={false}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

function CreateNewDatasource({
  active,
  history,
  isCreating,
  pageId,
  showUnsupportedPluginDialog,
}: any) {
  const newDatasourceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && newDatasourceRef.current) {
      scrollIntoView(newDatasourceRef.current, {
        behavior: "smooth",
        scrollMode: "always",
        block: "start",
        boundary: document.getElementById("new-integrations-wrapper"),
      });
    }
  }, [active]);
  return (
    <div id="new-datasources" ref={newDatasourceRef}>
      <Text kind="heading-s">Databases</Text>
      <NewQueryScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

const AddDatasourceModal = () => {
  const workspace = useSelector(getCurrentAppWorkspace);
  const appDetails = useSelector(getCurrentApplication);
  const openAddModal = useSelector(showAddDatasourceModalSelector);
  const dispatch = useDispatch();

  const onBack = () => {
    dispatch(showAddDatasourceModal(false));
  };

  return (
    <Modal open={openAddModal}>
      <ModalContent style={{ width: "75vw" }}>
        <div className="flex align-center justify-between">
          <Text kind="heading-m">
            {workspace.name} &bull; {appDetails?.name}
          </Text>
          <Button
            kind="secondary"
            onClick={onBack}
            size="md"
            startIcon={"arrow-left-line"}
          >
            Back to app
          </Button>
        </div>
        <ModalBody>
          <NewIntegrationsContainer id="new-integrations-wrapper">
            <CreateNewAPI
              history={history}
              isCreating={false}
              location={location}
              pageId={""}
            />
            <CreateNewDatasource
              history={history}
              isCreating={false}
              location={location}
              pageId={""}
            />
            <UseMockDatasources active={false} />
          </NewIntegrationsContainer>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddDatasourceModal;
