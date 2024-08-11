import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRealtimeAppEditors } from "selectors/appCollabSelectors";
import { getTypographyByKey } from "@appsmith/ads-old";
import ProfileImage from "pages/common/ProfileImage";
import UserApi from "ee/api/UserApi";
import styled from "styled-components";
import {
  collabStartEditingAppEvent,
  collabStopEditingAppEvent,
  collabResetAppEditors,
} from "actions/appCollabActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getIsAppLevelSocketConnected } from "selectors/websocketSelectors";
import { Tooltip } from "@appsmith/ads";

const UserImageContainer = styled.div`
  display: flex;
  margin-right: ${(props) => props.theme.spaces[3]}px;

  div {
    cursor: default;
    margin-left: ${(props) => props.theme.spaces[1]}px;
    width: 24px;
    height: 24px;
    margin-left: 0px;
  }

  .profile-image {
    margin-right: -6px;
    border: 1px solid var(--ads-v2-color-white);
    span {
      color: var(--ads-v2-color-fg);
      font-weight: normal;
      ${getTypographyByKey("btnSmall")};
    }
  }

  .more {
    z-index: 1;
  }
`;

interface RealtimeAppEditorsProps {
  applicationId?: string;
}

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
  const realtimeAppEditors = useSelector(getRealtimeAppEditors);
  useEditAppCollabEvents(applicationId);

  return realtimeAppEditors.length > 0 ? (
    <UserImageContainer className="app-realtime-editors">
      {realtimeAppEditors.slice(0, 3).map((el) => (
        <Tooltip
          content={
            <>
              <span style={{ margin: "0 0 8px 0", display: "block" }}>
                {el.name || el.email}
              </span>
              <b>Editing</b>
            </>
          }
          key={el.email}
        >
          <ProfileImage
            className="profile-image"
            source={`/api/${UserApi.photoURL}/${el.email}`}
            userName={el.name || el.email}
          />
        </Tooltip>
      ))}
      {realtimeAppEditors.length > 3 ? (
        <ProfileImage
          className="profile-image more"
          commonName={`+${realtimeAppEditors.length - 3}`}
        />
      ) : null}
    </UserImageContainer>
  ) : null;
}

export default RealtimeAppEditors;
