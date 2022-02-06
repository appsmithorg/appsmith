import React from "react";
import ProfileImage, { Profile } from "pages/common/ProfileImage";

import UserApi from "api/UserApi";

import { AppsmithNotification, NotificationTypes } from "entities/Notification";
import { getTypographyByKey } from "constants/DefaultTheme";
import { getCommentThreadURL } from "comments/utils";
import {
  markNotificationAsReadRequest,
  setIsNotificationsListVisible,
} from "actions/notificationActions";

import history from "utils/history";
import { useDispatch } from "react-redux";

import moment from "moment";
import styled from "styled-components";

import { APP_MODE } from "entities/App";
import OrgApi from "api/OrgApi";

import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";

export const NOTIFICATION_HEIGHT = 82;

const Container = styled.div`
  display: flex;
  width: 100%;
  padding: ${(props) => props.theme.spaces[6]}px;
  height: ${NOTIFICATION_HEIGHT}px;

  ${Profile} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
  }

  cursor: pointer;
`;

const NotificationBodyContainer = styled.div`
  ${(props) => getTypographyByKey(props, "p1")};
  & b {
    font-weight: 500;
  }

  & div {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    -webkit-box-orient: vertical;
  }
`;

const FlexContainer = styled.div`
  display: flex;
`;

const Time = styled.div`
  color: ${(props) => props.theme.colors.notifications.time};
  ${(props) => getTypographyByKey(props, "p3")};
`;

const ProfileImageContainer = styled.div`
  position: relative;
`;

const UnreadIndicator = styled.div`
  position: absolute;
  right: 9px;
  top: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.theme.colors.notifications.unreadIndicator};
`;

const getModeFromUserRole = async (orgId: string) => {
  try {
    const response = (await OrgApi.fetchOrg({ orgId })) as any;
    const userOrgPermissions = response?.data?.userPermissions || [];
    const canPublish = isPermitted(
      userOrgPermissions,
      PERMISSION_TYPE.PUBLISH_APPLICATION,
    );

    return canPublish ? APP_MODE.EDIT : APP_MODE.PUBLISHED;
  } catch (e) {
    return APP_MODE.PUBLISHED;
  }
};

const getModeFromRoleAndDomain = (
  modeFromRole: APP_MODE,
  modeFromDomain: APP_MODE,
) => {
  if (modeFromRole === APP_MODE.PUBLISHED) return APP_MODE.PUBLISHED;
  return modeFromDomain;
};

function CommentNotification(props: { notification: AppsmithNotification }) {
  const dispatch = useDispatch();
  const {
    _id,
    comment,
    createdAt,
    creationTime,
    event,
    id,
    isRead,
  } = props.notification;
  const {
    applicationId,
    applicationName,
    authorName,
    authorUsername,
    branchName,
    mode: modeFromComment,
    orgId,
    pageId,
    // resolvedState, TODO get from comment thread
    threadId,
  } = comment;

  const _createdAt = createdAt || creationTime;
  const displayName = authorName || authorUsername;
  let eventName = event;
  if (!event || event == "CREATED") {
    eventName = "left";
  } else if (event == "TAGGED") {
    eventName = "mentioned you in";
  }

  const handleClick = async () => {
    const modeFromRole = await getModeFromUserRole(orgId);
    const mode = getModeFromRoleAndDomain(modeFromRole, modeFromComment);

    const commentThreadUrl = getCommentThreadURL({
      applicationId,
      branch: branchName,
      commentThreadId: threadId,
      // isResolved: resolvedState?.active,
      mode,
      pageId,
    });
    dispatch(setIsNotificationsListVisible(false));
    history.push(
      `${commentThreadUrl.pathname}${commentThreadUrl.search}${commentThreadUrl.hash}`,
    );

    dispatch(markNotificationAsReadRequest(id || (_id as string)));
  };

  return (
    <FlexContainer onClick={handleClick}>
      <ProfileImageContainer>
        <ProfileImage
          side={25}
          source={`/api/${UserApi.photoURL}/${authorUsername}`}
          userName={displayName}
        />
        {!isRead && <UnreadIndicator />}
      </ProfileImageContainer>
      <NotificationBodyContainer>
        <div>
          <b>{displayName}</b> {eventName.toLowerCase()} a comment on
          <b> {applicationName}</b>
        </div>
        <Time>{moment(_createdAt).fromNow()}</Time>
      </NotificationBodyContainer>
    </FlexContainer>
  );
}

function CommentThreadNotification(props: {
  notification: AppsmithNotification;
}) {
  const dispatch = useDispatch();
  const {
    _id: _notificationId,
    commentThread,
    createdAt,
    creationTime,
    event,
    id: notificationId,
    isRead,
  } = props.notification;

  const {
    _id,
    applicationId,
    applicationName,
    authorName,
    authorUsername,
    branchName,
    id,
    mode: modeFromThread,
    orgId,
    pageId,
    resolvedState,
  } = commentThread;

  const commentThreadId = _id || id;

  const handleClick = async () => {
    const modeFromRole = await getModeFromUserRole(orgId);
    const mode = getModeFromRoleAndDomain(modeFromRole, modeFromThread);

    const commentThreadUrl = getCommentThreadURL({
      applicationId,
      branch: branchName,
      commentThreadId,
      isResolved: resolvedState?.active,
      mode,
      pageId,
    });

    dispatch(setIsNotificationsListVisible(false));

    history.push(
      `${commentThreadUrl.pathname}${commentThreadUrl.search}${commentThreadUrl.hash}`,
    );

    dispatch(
      markNotificationAsReadRequest(
        notificationId || (_notificationId as string),
      ),
    );
  };

  const _createdAt = createdAt || creationTime;
  const displayName = authorName || authorUsername;
  const eventName = event || "updated";

  return (
    <FlexContainer onClick={handleClick}>
      <ProfileImageContainer>
        <ProfileImage
          side={25}
          source={`/api/${UserApi.photoURL}/${authorUsername}`}
          userName={displayName}
        />
        {!isRead && <UnreadIndicator />}
      </ProfileImageContainer>
      <NotificationBodyContainer>
        <div>
          <b>{displayName}</b> {eventName.toLowerCase()} a thread on
          <b> {applicationName}</b>
        </div>
        <Time>{moment(_createdAt).fromNow()}</Time>
      </NotificationBodyContainer>
    </FlexContainer>
  );
}

const notificationByType = {
  [NotificationTypes.CommentNotification]: CommentNotification,
  [NotificationTypes.CommentThreadNotification]: CommentThreadNotification,
};

function NotificationListItem(props: { notification: AppsmithNotification }) {
  // TODO fix this, use type from api response
  const type = props.notification.comment
    ? NotificationTypes.CommentNotification
    : NotificationTypes.CommentThreadNotification;

  const Component = notificationByType[type];

  return (
    <Container>
      <Component notification={props.notification} />
    </Container>
  );
}

export default NotificationListItem;
