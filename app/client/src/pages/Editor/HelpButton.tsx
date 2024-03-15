import React, { useEffect, useState } from "react";

import { getAppsmithConfigs } from "@appsmith/configs";
import {
  APPSMITH_DISPLAY_VERSION,
  HELP_RESOURCE_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { showSignpostingModal } from "actions/onboardingActions";
import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "design-system";
import moment from "moment/moment";
import SignpostingPopup from "pages/Editor/FirstTimeUserOnboarding/Modal";
import { useDispatch, useSelector } from "react-redux";
import {
  getFirstTimeUserOnboardingModal,
  getIsFirstTimeUserOnboardingEnabled,
  getSignpostingSetOverlay,
  getSignpostingTooltipVisible,
  getSignpostingUnreadSteps,
} from "selectors/onboardingSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import bootIntercom from "utils/bootIntercom";
import TooltipContent from "./FirstTimeUserOnboarding/TooltipContent";
import { IntercomConsent } from "./IntercomConsent";

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
`;
const UnreadSteps = styled.div`
  position: absolute;
  height: 6px;
  width: 6px;
  border-radius: 50%;
  top: 10px;
  left: 22px;
  background-color: var(--ads-v2-color-fg-error);
`;

interface HelpItem {
  label: string;
  link?: string;
  id?: string;
  icon: string;
}

const HELP_MENU_ITEMS: HelpItem[] = [
  {
    icon: "book-line",
    label: "Documentation",
    link: "https://docs.appsmith.com/",
  },
  {
    icon: "bug-line",
    label: "Report a bug",
    link: "https://github.com/appsmithorg/appsmith/issues/new/choose",
  },
];

if (intercomAppID && window.Intercom) {
  HELP_MENU_ITEMS.push({
    icon: "chat-help",
    label: "Chat with us",
    id: "intercom-trigger",
  });
}

function HelpButtonTooltip(props: {
  isFirstTimeUserOnboardingEnabled: boolean;
  showSignpostingTooltip: boolean;
}) {
  if (props.isFirstTimeUserOnboardingEnabled) {
    return (
      <TooltipContent showSignpostingTooltip={props.showSignpostingTooltip} />
    );
  }

  return <>{createMessage(HELP_RESOURCE_TOOLTIP)}</>;
}

function HelpButton() {
  const [showIntercomConsent, setShowIntercomConsent] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const user = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const showSignpostingTooltip = useSelector(getSignpostingTooltipVisible);
  const onboardingModalOpen = useSelector(getFirstTimeUserOnboardingModal);
  const unreadSteps = useSelector(getSignpostingUnreadSteps);
  const setOverlay = useSelector(getSignpostingSetOverlay);
  const showUnreadSteps =
    !!unreadSteps.length &&
    isFirstTimeUserOnboardingEnabled &&
    !onboardingModalOpen;
  const menuProps = isFirstTimeUserOnboardingEnabled
    ? {
        open: onboardingModalOpen,
      }
    : {};
  const tooltipProps = isFirstTimeUserOnboardingEnabled
    ? {
        visible: showTooltip || showSignpostingTooltip,
        onVisibleChange: setShowTooltip,
      }
    : {};

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <Menu
      onOpenChange={(open) => {
        if (open) {
          if (isFirstTimeUserOnboardingEnabled) {
            dispatch(showSignpostingModal(true));
            setShowTooltip(false);
          }
          setShowIntercomConsent(false);
          AnalyticsUtil.logEvent("OPEN_HELP", {
            page: "Editor",
            signpostingActive: isFirstTimeUserOnboardingEnabled,
          });
        }
      }}
      {...menuProps}
    >
      <MenuTrigger>
        <div className="relative">
          <Tooltip
            align={{
              targetOffset: [5, 0],
            }}
            content={
              <HelpButtonTooltip
                isFirstTimeUserOnboardingEnabled={
                  isFirstTimeUserOnboardingEnabled
                }
                showSignpostingTooltip={showSignpostingTooltip}
              />
            }
            destroyTooltipOnHide={isFirstTimeUserOnboardingEnabled}
            isDisabled={onboardingModalOpen}
            mouseLeaveDelay={0}
            placement="bottomRight"
            {...tooltipProps}
          >
            <Button
              data-testid="t--help-button"
              kind="tertiary"
              size="md"
              startIcon="question-line"
            >
              Help
            </Button>
          </Tooltip>
          {showUnreadSteps && <UnreadSteps className="unread" />}
        </div>
      </MenuTrigger>
      {isFirstTimeUserOnboardingEnabled ? (
        <SignpostingPopup
          setOverlay={setOverlay}
          setShowIntercomConsent={setShowIntercomConsent}
          showIntercomConsent={showIntercomConsent}
        />
      ) : (
        <MenuContent collisionPadding={10} style={{ width: HELP_MODAL_WIDTH }}>
          {showIntercomConsent ? (
            <IntercomConsent showIntercomConsent={setShowIntercomConsent} />
          ) : (
            <>
              {HELP_MENU_ITEMS.map((item) => (
                <MenuItem
                  id={item.id}
                  key={item.label}
                  onSelect={(e) => {
                    if (item.link) {
                      window.open(item.link, "_blank");
                    }
                    if (item.id === "intercom-trigger") {
                      e?.preventDefault();
                      if (intercomAppID && window.Intercom) {
                        if (user?.isIntercomConsentGiven || cloudHosting) {
                          window.Intercom("show");
                        } else {
                          setShowIntercomConsent(true);
                        }
                      }
                    }
                  }}
                  startIcon={item.icon}
                >
                  {item.label}
                </MenuItem>
              ))}
            </>
          )}

          {appVersion.id && (
            <>
              <MenuSeparator />
              <MenuItem className="menuitem-nohover">
                <HelpFooter>
                  <span>
                    {createMessage(
                      APPSMITH_DISPLAY_VERSION,
                      appVersion.edition,
                      appVersion.id,
                    )}
                  </span>
                  <span>
                    Released {moment(appVersion.releaseDate).fromNow()}
                  </span>
                </HelpFooter>
              </MenuItem>
            </>
          )}
        </MenuContent>
      )}
    </Menu>
  );
}

export default HelpButton;
