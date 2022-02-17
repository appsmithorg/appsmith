import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import NotificationsList from "./NotificationsList";
import BellIcon from "remixicon-react/Notification3LineIcon";
import { Popover2 } from "@blueprintjs/popover2";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { useDispatch } from "react-redux";

import {
  fetchNotificationsRequest,
  fetchUnreadNotificationsCountRequest,
  setIsNotificationsListVisible,
} from "actions/notificationActions";
import styled from "styled-components";
import { Colors } from "constants/Colors";

import {
  unreadCountSelector,
  isNotificationsListVisibleSelector,
} from "selectors/notificationSelectors";
import TooltipComponent from "components/ads/Tooltip";
import {
  createMessage,
  NOTIFICATIONS_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";

const Container = styled.div`
  position: relative;
  padding: ${(props) => props.theme.spaces[1]}px;
  margin-right: ${(props) => props.theme.spaces[9]}px;
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
        <TooltipComponent
          boundary="viewport"
          content={createMessage(NOTIFICATIONS_TOOLTIP)}
          hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
          position={Position.BOTTOM}
        >
          <StyledBellIcon color={Colors.GRAY} />
        </TooltipComponent>
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
