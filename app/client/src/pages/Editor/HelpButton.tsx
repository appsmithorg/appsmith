import React, { useEffect } from "react";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useDispatch, useSelector } from "react-redux";
import bootIntercom from "utils/bootIntercom";
import {
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  HELP_RESOURCE_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
  MenuSeparator,
} from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import moment from "moment/moment";
import styled from "styled-components";
import {
  getFirstTimeUserOnboardingModal,
  getIsFirstTimeUserOnboardingEnabled,
  getSignpostingUnreadSteps,
} from "selectors/onboardingSelectors";
import SignpostingPopup from "pages/Editor/FirstTimeUserOnboarding/Modal";
import { showSignpostingModal } from "actions/onboardingActions";
import { triggerWelcomeTour } from "./FirstTimeUserOnboarding/Utils";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

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

type HelpItem = {
  label: string;
  link?: string;
  id?: string;
  icon: string;
};

const HELP_MENU_ITEMS: HelpItem[] = [
  {
    icon: "file-line",
    label: "Documentation",
    link: "https://docs.appsmith.com/",
  },
  {
    icon: "bug-line",
    label: "Report a bug",
    link: "https://github.com/appsmithorg/appsmith/issues/new/choose",
  },
  {
    icon: "discord",
    label: "Join our discord",
    link: "https://discord.gg/rBTTVJp",
  },
];

if (intercomAppID && window.Intercom) {
  HELP_MENU_ITEMS.push({
    icon: "chat-help",
    label: "Chat with us",
    id: "intercom-trigger",
  });
}

function HelpButton() {
  const user = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const onboardingModalOpen = useSelector(getFirstTimeUserOnboardingModal);
  const unreadSteps = useSelector(getSignpostingUnreadSteps);
  const currentApplicationId = useSelector(getCurrentApplicationId);
  const isAirgappedInstance = isAirgapped();
  const showUnroadSteps =
    !!unreadSteps.length &&
    isFirstTimeUserOnboardingEnabled &&
    !onboardingModalOpen;
  const menuProps = isFirstTimeUserOnboardingEnabled
    ? {
        open: onboardingModalOpen,
        modal: false,
      }
    : {};

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <Menu
      onOpenChange={(open) => {
        if (open) {
          isFirstTimeUserOnboardingEnabled &&
            dispatch(showSignpostingModal(true));
          // setShowIntercomConsent(false);
          AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
        }
      }}
      {...menuProps}
    >
      <MenuTrigger>
        <div className="relative">
          <Tooltip
            content={createMessage(HELP_RESOURCE_TOOLTIP)}
            placement="bottomRight"
          >
            <>
              <Button
                data-testid="t--help-button"
                kind="tertiary"
                size="md"
                startIcon="question-line"
              >
                Help
              </Button>
              {showUnroadSteps && <UnreadSteps className="unread" />}
            </>
          </Tooltip>
        </div>
      </MenuTrigger>
      {isFirstTimeUserOnboardingEnabled ? (
        <SignpostingPopup />
      ) : (
        <MenuContent collisionPadding={10} style={{ width: HELP_MODAL_WIDTH }}>
          {/* TODO: Intercom consent */}
          {/* {showIntercomConsent ? (
            <IntercomConsent showIntercomConsent={setShowIntercomConsent} />
          ) : ( */}
          {!isAirgappedInstance && (
            <>
              <MenuItem
                onSelect={() =>
                  triggerWelcomeTour(dispatch, currentApplicationId)
                }
                startIcon="guide"
              >
                Try guided tour
              </MenuItem>
              <MenuSeparator />
            </>
          )}
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
                      // setShowIntercomConsent(true);
                    }
                  }
                }
              }}
              startIcon={item.icon}
            >
              {item.label}
            </MenuItem>
          ))}

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
                      cloudHosting,
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
