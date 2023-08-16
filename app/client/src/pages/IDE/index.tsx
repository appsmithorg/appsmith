import React, { useEffect } from "react";
import styled from "styled-components";
import { widgetInitialisationSuccess } from "../../actions/widgetActions";
import { useDispatch } from "react-redux";
import { editorInitializer } from "../../utils/editor/EditorUtils";
import SideBar from "./Sidebar";

const Body = styled.div`
  background: #f1f5f9;
  height: calc(100vh - 40px);
  display: grid;
  grid-template-columns: 50px 300px auto;
  grid-template-rows: 1fr 32px;
  grid-gap: 4px;
`;

const LeftPane = styled.div`
  background-color: white;
  margin-top: 4px;
  border-radius: 4px;
`;
const MainPane = styled.div`
  margin-top: 4px;
  background-color: white;
  border-radius: 4px;
  margin-right: 5px;
`;

const DebugBar = styled.div`
  background-color: white;
  grid-column-start: 2;
  grid-column-end: 4;
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
`;

const IDE = function () {
  const dispatch = useDispatch();
  useEffect(() => {
    editorInitializer().then(() => {
      dispatch(widgetInitialisationSuccess());
    });
  }, []);
  return (
    <Body id="IDE-body">
      <SideBar />
      <LeftPane />
      <MainPane />
      <DebugBar />
    </Body>
  );
};

export default IDE;
