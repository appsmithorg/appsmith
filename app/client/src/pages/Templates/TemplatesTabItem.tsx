import { Popover2, Classes as Popover2Classes } from "@blueprintjs/popover2";
import { setTemplateNotificationSeenAction } from "actions/templateActions";
import { TextType, Text } from "components/ads";
import Icon, { IconSize } from "components/ads/Icon";
import { matchTemplatesPath } from "constants/routes";
import { isNull } from "lodash";
import React, { ReactNode, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { showTemplateNotificationSelector } from "selectors/templatesSelectors";
import styled from "styled-components";

const NotificationWrapper = styled.div`
  background-color: #f1f1f1;
  padding: 8px 18px;
  display: flex;
  flex-direction: row;

  .text-wrapper {
    display: flex;
    flex-direction: column;
    margin-left: 18px;
  }

  .description {
    margin-top: 2px;
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
      <Icon name={"info"} size={IconSize.XXL} />
      <div className={"text-wrapper"}>
        <Text type={TextType.H4}>Introducing Templates</Text>
        <Text className="description" type={TextType.P1}>
          You can browse, fork, and make them your own here
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
  const location = useLocation();
  const dispatch = useDispatch();

  const showNotification =
    !hasSeenNotification &&
    !isFetchingApplications &&
    !isNull(hasSeenNotification);

  useEffect(() => {
    if (matchTemplatesPath(location.pathname) && !hasSeenNotification) {
      dispatch(setTemplateNotificationSeenAction(true));
    }
  }, [location.pathname, hasSeenNotification]);

  return (
    <Suspense fallback={<div />}>
      <StyledPopover>
        <Popover2
          content={<TemplateFeatureNotification />}
          isOpen={!!showNotification}
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
