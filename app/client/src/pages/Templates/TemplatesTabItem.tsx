import { Popover2, Classes as Popover2Classes } from "@blueprintjs/popover2";
import { useLocation } from "react-router";
import { setTemplateNotificationSeenAction } from "actions/templateActions";
import { Classes } from "components/ads";
import { TextType, Text } from "design-system";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { matchTemplatesPath } from "constants/routes";
import { isNull } from "lodash";
import React, { ReactNode, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  INTRODUCING_TEMPLATES,
  createMessage,
  TEMPLATE_NOTIFICATION_DESCRIPTION,
} from "@appsmith/constants/messages";
import {
  getIsFetchingApplications,
  getUserApplicationsWorkspacesList,
} from "selectors/applicationSelectors";
import { showTemplateNotificationSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import { AppState } from "reducers";

const NotificationWrapper = styled.div`
  background-color: ${Colors.SEA_SHELL};
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[8]}px`};
  display: flex;
  flex-direction: row;
  max-width: 376px;

  .${Classes.ICON} {
    align-items: unset;
    margin-top: ${(props) => props.theme.spaces[0] + 1}px;
  }

  .text-wrapper {
    display: flex;
    flex-direction: column;
    margin-left: ${(props) => props.theme.spaces[3]}px;
  }

  .description {
    margin-top: ${(props) => props.theme.spaces[0] + 2}px;
  }
`;

const StyledPopover = styled.div`
  .${Popover2Classes.POPOVER2_TARGET} {
    display: flex;
  }
  display: flex;
`;

export function TemplateFeatureNotification() {
  return (
    <NotificationWrapper>
      <Icon name={"info"} size={IconSize.XXXL} />
      <div className={"text-wrapper"}>
        <Text color={Colors.CODE_GRAY} type={TextType.H4}>
          {createMessage(INTRODUCING_TEMPLATES)}
        </Text>
        <Text
          className="description"
          color={Colors.CODE_GRAY}
          type={TextType.P1}
        >
          {createMessage(TEMPLATE_NOTIFICATION_DESCRIPTION)}
        </Text>
      </div>
    </NotificationWrapper>
  );
}

interface TemplatesTabItemProps {
  children: ReactNode;
}

export function TemplatesTabItem(props: TemplatesTabItemProps) {
  const hasSeenNotification = useSelector(showTemplateNotificationSelector);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const workspaceListLength = useSelector(
    (state: AppState) => getUserApplicationsWorkspacesList(state).length,
  );
  const location = useLocation();
  const dispatch = useDispatch();

  const showNotification =
    !hasSeenNotification &&
    !isFetchingApplications &&
    !isNull(hasSeenNotification) &&
    workspaceListLength;

  const setNotificationSeenFlag = () => {
    dispatch(setTemplateNotificationSeenAction(true));
  };

  useEffect(() => {
    if (matchTemplatesPath(location.pathname) && !hasSeenNotification) {
      setNotificationSeenFlag();
    }
  }, [location.pathname, hasSeenNotification]);

  return (
    <Suspense fallback={<div />}>
      <StyledPopover>
        <Popover2
          content={<TemplateFeatureNotification />}
          enforceFocus={false}
          isOpen={!!showNotification}
          modifiers={{
            offset: {
              enabled: true,
              options: {
                offset: [0, 0],
              },
            },
          }}
          onClose={setNotificationSeenFlag}
          placement="bottom-start"
          portalClassName="templates-notification"
          targetTagName="div"
        >
          {props.children}
        </Popover2>
      </StyledPopover>
    </Suspense>
  );
}
