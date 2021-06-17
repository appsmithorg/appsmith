import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import NotificationsList from "./NotificationsList";
import { ReactComponent as BellIcon } from "assets/icons/ads/bell.svg";
import { Popover2 } from "@blueprintjs/popover2";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { useDispatch } from "react-redux";

import {
  fetchNotificationsRequest,
  fetchUnreadNotificationsCountRequest,
  setIsNotificationsListVisible,
} from "actions/notificationActions";
import styled from "styled-components";

import {
  unreadCountSelector,
  isNotificationsListVisibleSelector,
} from "selectors/notificationSelectors";

const Container = styled.div`
  position: relative;
  padding: ${(props) => props.theme.spaces[1]}px;
  margin-right: ${(props) => props.theme.spaces[9]}px;
  top: 3px;
  cursor: pointer;
`;

const BellIndicatorContainer = styled.div`
  position: absolute;
  top: -7px;
  right: -5px;
`;

const Count = styled.div`
  position: absolute;
  top: 43%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const BellIndicatorIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.theme.colors.notifications.bellIndicator};
`;

const StyledBellIcon = styled(BellIcon)`
  width: 22px;
  height: 22px;
`;

function Bell() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchNotificationsRequest());
    dispatch(fetchUnreadNotificationsCountRequest());
  }, []);

  const unreadCount = useSelector(unreadCountSelector);
  const showIndicator = unreadCount > 0;

  const isOpen = useSelector(isNotificationsListVisibleSelector);

  return (
    <Popover2
      content={<NotificationsList />}
      isOpen={isOpen}
      minimal
      modifiers={{
        offset: {
          enabled: true,
          options: {
            offset: [-15, 10],
          },
        },
        preventOverflow: {
          enabled: true,
        },
      }}
      onInteraction={(nextOpenState) =>
        dispatch(setIsNotificationsListVisible(nextOpenState))
      }
      placement={"bottom-end"}
    >
      <Container>
        <StyledBellIcon />
        {showIndicator && (
          <BellIndicatorContainer>
            {/** Not using overflow ellipsis here for UI specs */}
            <BellIndicatorIcon />
            <Count>
              {unreadCount > 100
                ? `${unreadCount}`.slice(0, 2) + ".."
                : unreadCount}
            </Count>
          </BellIndicatorContainer>
        )}
      </Container>
    </Popover2>
  );
}

export default Bell;
