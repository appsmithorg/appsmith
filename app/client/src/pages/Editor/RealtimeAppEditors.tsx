import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRealtimeAppEditors } from "selectors/appCollabSelectors";
import TooltipComponent from "components/ads/Tooltip";
import ProfileImage from "../common/ProfileImage";
import UserApi from "api/UserApi";
import styled from "styled-components";
import { AppState } from "reducers";
import {
  collabStartEditingAppEvent,
  collabStopEditingAppEvent,
  collabResetAppEditorsEvent,
} from "actions/appCollabActions";

const UserImageContainer = styled.div`
  display: flex;
  margin-right: ${(props) => props.theme.spaces[3]}px;

  div {
    cursor: default;
    margin-left: ${(props) => props.theme.spaces[1]}px;
    width: 24px;
    height: 24px;
  }

  div:last-child {
    margin-right: 0;
  }
`;

type RealtimeAppEditorsProps = {
  applicationId?: string;
};

export function useEditAppCollabEvents(applicationId?: string) {
  const dispatch = useDispatch();

  const isWebsocketConnected = useSelector(
    (state: AppState) => state.ui.websocket.connected,
  );

  useEffect(() => {
    // websocket has to be connected as we only fire this event once.
    isWebsocketConnected &&
      applicationId &&
      dispatch(collabStartEditingAppEvent(applicationId));
    return () => {
      dispatch(collabResetAppEditorsEvent());
      isWebsocketConnected &&
        applicationId &&
        dispatch(collabStopEditingAppEvent(applicationId));
    };
  }, [applicationId, isWebsocketConnected]);
}

function RealtimeAppEditors(props: RealtimeAppEditorsProps) {
  const { applicationId } = props;
  const realtimeAppEditors = useSelector(getRealtimeAppEditors);
  useEditAppCollabEvents(applicationId);

  return realtimeAppEditors.length > 0 ? (
    <UserImageContainer>
      {realtimeAppEditors.slice(0, 5).map((el) => (
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
      {realtimeAppEditors.length > 5 ? (
        <ProfileImage
          className="app-realtime-editors"
          commonName={`+${realtimeAppEditors.length - 5}`}
        />
      ) : null}
    </UserImageContainer>
  ) : null;
}

export default RealtimeAppEditors;
