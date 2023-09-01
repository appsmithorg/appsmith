import React, { useEffect } from "react";
import styled from "styled-components";
import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import { useDispatch, useSelector } from "react-redux";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import SideBar from "./Sidebar";
import DebugBar from "./BottomBar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import { getIdeSidebarWidth } from "./ideSelector";
import { Helmet } from "react-helmet";
import GlobalHotKeys from "../Editor/GlobalHotKeys";
import GitSyncModal from "../Editor/gitSync/GitSyncModal";
import DisconnectGitModal from "../Editor/gitSync/DisconnectGitModal";
import RepoLimitExceededErrorModal from "../Editor/gitSync/RepoLimitExceededErrorModal";
import TemplatesModal from "../Templates/TemplatesModal";
import ImportedApplicationSuccessModal from "../Editor/gitSync/ImportedAppSuccessModal";
import ReconnectDatasourceModal from "../Editor/gitSync/ReconnectDatasourceModal";

const Body = styled.div<{ leftPaneWidth: number }>`
  height: calc(100vh - 40px);
  padding-top: 4px;
  background: #f1f5f9;
  display: grid;
  grid-template-columns: 50px ${(props) => props.leftPaneWidth || 300}px auto;
  grid-template-rows: 1fr 37px;
  grid-gap: 4px;
`;

const IDE = function () {
  const dispatch = useDispatch();
  useEffect(() => {
    editorInitializer().then(() => {
      dispatch(widgetInitialisationSuccess());
    });
  }, []);
  const currentApplicationName = useSelector(
    (state) => state.ui.applications.currentApplication?.name,
  );
  const leftPaneWidth = useSelector(getIdeSidebarWidth);
  return (
    <div>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${currentApplicationName} |`} Editor | Appsmith</title>
      </Helmet>
      <GlobalHotKeys>
        <Body id="IDE-body" leftPaneWidth={leftPaneWidth}>
          <SideBar />
          <LeftPane />
          <MainPane />
          <DebugBar />
        </Body>
        <GitSyncModal />
        <DisconnectGitModal />
        <RepoLimitExceededErrorModal />
        <TemplatesModal />
        <ImportedApplicationSuccessModal />
        <ReconnectDatasourceModal />
      </GlobalHotKeys>
    </div>
  );
};

export default IDE;
