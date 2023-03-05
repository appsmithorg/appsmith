import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRealtimeAppEditors } from "selectors/appCollabSelectors";
import { getTypographyByKey, TooltipComponent } from "design-system-old";
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
import { Colors } from "constants/Colors";

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
    border: 1px solid ${Colors.WHITE};
    span {
      color: ${Colors.GRAY_700};
      font-weight: normal;
      ${getTypographyByKey("btnSmall")};
    }
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
  const realtimeAppEditors = useSelector(getRealtimeAppEditors);
  useEditAppCollabEvents(applicationId);

  return realtimeAppEditors.length > 0 ? (
    <UserImageContainer className="app-realtume-editors">
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
            className="profile-image"
            source={`/api/${UserApi.photoURL}/${el.email}`}
            userName={el.name || el.email}
          />
        </TooltipComponent>
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
