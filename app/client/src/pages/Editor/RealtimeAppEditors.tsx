import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRealtimeAppEditors } from "selectors/appCollabSelectors";
import { TooltipComponent } from "design-system";
import ProfileImage from "pages/common/ProfileImage";
import UserApi from "@appsmith/api/UserApi";
import styled from "styled-components";
import {
  collabStartEditingAppEvent,
  collabStopEditingAppEvent,
  collabResetAppEditors,
} from "actions/appCollabActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getIsAppLevelSocketConnected } from "selectors/websocketSelectors";
import { User } from "constants/userConstants";

const UserImageContainer = styled.div`
  display: flex;
  margin-right: ${(props) => props.theme.spaces[4]}px;

  div {
    cursor: default;
    margin-left: ${(props) => props.theme.spaces[1]}px;
    width: 24px;
    height: 24px;
    margin-left: 0px;
  }

  .app-realtime-editors {
    margin-right: -6px;
  }

  .more {
    z-index: 1;
  }
`;

type RealtimeAppEditorsProps = {
  applicationId?: string;
};

export function useEditAppCollabEvents(applicationId?: string) {
  const dispatch = useDispatch();

  const isWebsocketConnected = useSelector(getIsAppLevelSocketConnected);

  const currentPageId = useSelector(getCurrentPageId);

  useEffect(() => {
    // websocket has to be connected as we only fire this event once.
    isWebsocketConnected &&
      applicationId &&
      dispatch(collabStartEditingAppEvent(applicationId));
    return () => {
      dispatch(collabResetAppEditors());
      isWebsocketConnected &&
        applicationId &&
        dispatch(collabStopEditingAppEvent(applicationId));
    };
  }, [applicationId, currentPageId, isWebsocketConnected]);
}

function RealtimeAppEditors(props: RealtimeAppEditorsProps) {
  const { applicationId } = props;
  const realtimeAppEditors: User[] = [
    {
      email: "Hola@test.com",
      name: "Hola",
      username: "Hola",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
    {
      email: "Abc@test.com",
      name: "Abc",
      username: "Abc",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
    {
      email: "Bamboo@test.com",
      name: "Bamboo",
      username: "Bamboo",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
    {
      email: "Hola1@test.com",
      name: "Hola1",
      username: "Hola1",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
    {
      email: "Abc2@test.com",
      name: "Abc2",
      username: "Abc2",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
    {
      email: "Bamboo3@test.com",
      name: "Bamboo3",
      username: "Bamboo3",
      gender: "MALE",
      isSuperUser: false,
      isConfigurable: false,
      enableTelemetry: false,
      workspaceIds: [""],
    },
  ];
  // const realtimeAppEditors = useSelector(getRealtimeAppEditors);
  // useEditAppCollabEvents(applicationId);

  return realtimeAppEditors.length > 0 ? (
    <UserImageContainer>
      {realtimeAppEditors.slice(0, 3).map((el) => (
        <TooltipComponent
          content={
            <>
              <span style={{ margin: "0 0 8px 0", display: "block" }}>
                {el.name || el.email}
              </span>
              <b>Editing</b>
            </>
          }
          hoverOpenDelay={100}
          key={el.email}
        >
          <ProfileImage
            className="app-realtime-editors"
            source={`/api/${UserApi.photoURL}/${el.email}`}
            userName={el.name || el.email}
          />
        </TooltipComponent>
      ))}
      {realtimeAppEditors.length > 3 ? (
        <ProfileImage
          className="app-realtime-editors more"
          commonName={`+${realtimeAppEditors.length - 3}`}
        />
      ) : null}
    </UserImageContainer>
  ) : null;
}

export default RealtimeAppEditors;
