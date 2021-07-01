import React from "react";
import ProfileImage, { Profile } from "pages/common/ProfileImage";

import UserApi from "api/UserApi";

import { AppsmithNotification, NotificationTypes } from "entities/Notification";
import { getTypographyByKey } from "constants/DefaultTheme";
import { getCommentThreadURL } from "comments/utils";
import { markNotificationAsReadRequest } from "actions/notificationActions";

import history from "utils/history";
import { useDispatch } from "react-redux";

import moment from "moment";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  width: 100%;
  padding: ${(props) => props.theme.spaces[6]}px;

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

function CommentNotification(props: { notification: AppsmithNotification }) {
  const dispatch = useDispatch();
  const {
    _id,
    comment,
    createdAt,
    creationTime,
    id,
    isRead,
  } = props.notification;
  const {
    applicationId,
    applicationName,
    authorName,
    authorUsername,
    mode,
    pageId,
    // resolvedState, TODO get from comment thread
    threadId,
  } = comment;

  const commentThreadUrl = getCommentThreadURL({
    applicationId,
    commentThreadId: threadId,
    // isResolved: resolvedState?.active,
    mode,
    pageId,
  });

  const _createdAt = createdAt || creationTime;
  const displayName = authorName || authorUsername;

  const handleClick = () => {
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
          <b>{displayName}</b> left a comment on <b>{applicationName}</b>
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
    id: notificationId,
    isRead,
  } = props.notification;

  const {
    _id,
    applicationId,
    applicationName,
    authorName,
    authorUsername,
    id,
    mode,
    pageId,
    resolvedState,
  } = commentThread;

  const commentThreadId = _id || id;

  const commentThreadUrl = getCommentThreadURL({
    applicationId,
    commentThreadId,
    isResolved: resolvedState?.active,
    mode,
    pageId,
  });

  const handleClick = () => {
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
          <b>{displayName}</b> left a comment on <b>{applicationName}</b>
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
