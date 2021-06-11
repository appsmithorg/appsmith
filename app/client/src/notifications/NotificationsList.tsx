import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { notificationsSelector } from "selectors/notificationSelectors";
import NotificationListItem from "./NotificationListItem";
import { AppsmithNotification } from "entities/Notification";

import { createMessage, COMMENTS, MARK_ALL_AS_READ } from "constants/messages";

import Button, { Category } from "components/ads/Button";
import { getTypographyByKey } from "constants/DefaultTheme";

import { Virtuoso } from "react-virtuoso";

import { markAllNotificationsAsReadRequest } from "actions/notificationActions";

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

function NotificationsList() {
  const notifications = useSelector(notificationsSelector);
  const height = Math.min(4, notifications.length) * NOTIFICATION_HEIGHT;

  return (
    <Container>
      <NotificationsListHeader />
      <Virtuoso
        components={{
          Footer() {
            return (
              <div
                style={{
                  padding: "2rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Loading...
              </div>
            );
          },
        }}
        data={notifications}
        endReached={() => {
          return Promise.resolve([]);
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
    </Container>
  );
}

export default NotificationsList;
