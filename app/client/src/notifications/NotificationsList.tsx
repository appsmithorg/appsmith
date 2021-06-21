import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";

import {
  notificationsSelector,
  fetchingNotificationsSelector,
} from "selectors/notificationSelectors";
import NotificationListItem from "./NotificationListItem";
import { AppsmithNotification } from "entities/Notification";

import {
  createMessage,
  COMMENTS,
  MARK_ALL_AS_READ,
  NO_NOTIFICATIONS_TO_SHOW,
} from "constants/messages";

import Button, { Category } from "components/ads/Button";
import { getTypographyByKey } from "constants/DefaultTheme";

import { Virtuoso } from "react-virtuoso";

import {
  fetchNotificationsRequest,
  markAllNotificationsAsReadRequest,
} from "actions/notificationActions";

import { ReactComponent as EmptyState } from "assets/icons/comments/notifications-empty-state.svg";

const Container = styled.div`
  width: 326px;
  max-height: 376px;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.spaces[4] + 1}px;

  & .title {
    ${(props) => getTypographyByKey(props, "p1")};
    color: ${(props) => props.theme.colors.notifications.listHeaderTitle};
  }

  & .mark-all-as-read {
    border-color: ${(props) =>
      props.theme.colors.notifications.markAllAsReadButtonBackground};
    background-color: ${(props) =>
      props.theme.colors.notifications.markAllAsReadButtonBackground};
    color: ${(props) =>
      props.theme.colors.notifications.markAllAsReadButtonText};
  }
`;

const Label = styled.div`
  color: ${(props) => props.theme.colors.notifications.label};
  ${(props) => getTypographyByKey(props, "p1")}
`;

const EmptyNotificationsStateContainer = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

function EmptyNotificationsState() {
  return (
    <EmptyNotificationsStateContainer>
      <EmptyState />
      <Label>{createMessage(NO_NOTIFICATIONS_TO_SHOW)}</Label>
    </EmptyNotificationsStateContainer>
  );
}

function NotificationsListHeader() {
  const dispatch = useDispatch();

  return (
    <StyledHeader>
      <div className="title">{createMessage(COMMENTS)}</div>
      <Button
        category={Category.primary}
        className={"mark-all-as-read"}
        onClick={() => {
          dispatch(markAllNotificationsAsReadRequest());
        }}
        text={createMessage(MARK_ALL_AS_READ)}
        type="button"
      />
    </StyledHeader>
  );
}

const NOTIFICATION_HEIGHT = 63;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${(props) => props.theme.spaces[4]}px;
`;

function NotificationsList() {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);
  const fetchingNotifications = useSelector(fetchingNotificationsSelector);
  const height = Math.min(4, notifications.length) * NOTIFICATION_HEIGHT;

  return (
    <Container>
      <NotificationsListHeader />
      {notifications.length > 0 ? (
        <Virtuoso
          components={{
            Footer() {
              if (!fetchingNotifications) return null;

              return (
                <Footer>
                  <Spinner size={IconSize.LARGE} />
                </Footer>
              );
            },
          }}
          data={notifications}
          endReached={(index: number) => {
            const last = notifications[index];
            const { createdAt, creationTime } = last || {};
            const _createdTime = createdAt || creationTime;
            dispatch(fetchNotificationsRequest(_createdTime));
          }}
          itemContent={(index: number, notification: AppsmithNotification) => (
            <NotificationListItem
              key={notification.id}
              notification={notification}
            />
          )}
          overscan={1}
          style={{ height }}
        />
      ) : (
        <EmptyNotificationsState />
      )}
    </Container>
  );
}

export default NotificationsList;
