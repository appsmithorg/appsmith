import React from "react";
import ProfileImage, { Profile } from "pages/common/ProfileImage";

import styled from "styled-components";

import UserApi from "api/UserApi";

import { AppsmithNotification, NotificationTypes } from "entities/Notification";

import { getTypographyByKey } from "constants/DefaultTheme";
// import moment from "moment";

import { getCommentThreadURL } from "comments/utils";

import history from "utils/history";
import { useDispatch } from "react-redux";
import { markThreadAsReadRequest } from "actions/commentActions";

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

// eslint-disable-next-line
function CommentNotification(props: { notification?: AppsmithNotification }) {
  // TODO handle click
  return (
    <FlexContainer>
      <ProfileImage
        side={25}
        source={`/api/${UserApi.photoURL}`}
        userName={""}
      />
      <NotificationBodyContainer>
        <div>
          <b>Comment</b> notification body
        </div>
        {/* <Time>{moment().fromNow()}</Time> */}
        <Time>An hour ago</Time>
      </NotificationBodyContainer>
    </FlexContainer>
  );
}

function CommentThreadNotification(props: {
  notification: AppsmithNotification;
}) {
  const dispatch = useDispatch();
  const { commentThread } = props.notification;
  // TODO add isResolved, applicationId, pageId
  // mode: commentThread?.mode
  const commentThreadUrl = getCommentThreadURL({
    commentThreadId: commentThread?.id,
  });

  const handleClick = () => {
    history.push(
      `${commentThreadUrl.pathname}${commentThreadUrl.search}${commentThreadUrl.hash}`,
    );

    dispatch(markThreadAsReadRequest(commentThread?.id));
  };

  // TODO use notification isRead state
  const isRead = true;

  return (
    <FlexContainer onClick={handleClick}>
      <ProfileImageContainer>
        <ProfileImage
          side={25}
          source={`/api/${UserApi.photoURL}`}
          userName={""}
        />
        {!isRead && <UnreadIndicator />}
      </ProfileImageContainer>
      <NotificationBodyContainer>
        <div>
          <b>Comment Thread</b> notification body
        </div>
        {/* <Time>{moment().fromNow()}</Time> */}
        <Time>An hour ago</Time>
      </NotificationBodyContainer>
    </FlexContainer>
  );
}

const notificationByType = {
  [NotificationTypes.CommentNotification]: CommentNotification,
  [NotificationTypes.CommentThreadNotification]: CommentThreadNotification,
};

function NotificationListItem(props: { notification: AppsmithNotification }) {
  const Component =
    notificationByType[NotificationTypes.CommentThreadNotification];

  return (
    <Container>
      <Component notification={props.notification} />
    </Container>
  );
}

export default NotificationListItem;
