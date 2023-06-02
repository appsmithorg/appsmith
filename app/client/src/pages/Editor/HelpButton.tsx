import React, { useEffect, useState } from "react";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useDispatch, useSelector } from "react-redux";
import bootIntercom, { updateIntercomProperties } from "utils/bootIntercom";
import {
  APPSMITH_DISPLAY_VERSION,
  CONTINUE,
  createMessage,
  HELP_RESOURCE_TOOLTIP,
  INTERCOM_CONSENT_MESSAGE,
} from "@appsmith/constants/messages";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
  MenuSeparator,
  Text,
} from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import moment from "moment/moment";
import styled from "styled-components";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { updateIntercomConsent, updateUserDetails } from "actions/userActions";

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
`;
const ConsentContainer = styled.div`
  padding: 10px;
`;
const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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

function IntercomConsent({
  showIntercomConsent,
}: {
  showIntercomConsent: (val: boolean) => void;
}) {
  const user = useSelector(getCurrentUser);
  const instanceId = useSelector(getInstanceId);
  const dispatch = useDispatch();

  const sendUserDataToIntercom = () => {
    updateIntercomProperties(instanceId, user);
    dispatch(
      updateUserDetails({
        intercomConsentGiven: true,
      }),
    );
    dispatch(updateIntercomConsent());
    showIntercomConsent(false);
    window.Intercom("show");
  };
  return (
    <ConsentContainer>
      <ActionsRow>
        <Button
          isIconButton
          kind="tertiary"
          onClick={() => showIntercomConsent(false)}
          size="sm"
          startIcon="arrow-left"
        />
      </ActionsRow>
      <div className="mb-3" data-testid="t--intercom-consent-text">
        <Text kind="body-s" renderAs="p">
          {createMessage(INTERCOM_CONSENT_MESSAGE)}
        </Text>
      </div>
      <Button kind="primary" onClick={sendUserDataToIntercom} size="sm">
        {createMessage(CONTINUE)}
      </Button>
    </ConsentContainer>
  );
}

function HelpButton() {
  const user = useSelector(getCurrentUser);
  const [showIntercomConsent, setShowIntercomConsent] = useState(false);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <Menu
      onOpenChange={(open) => {
        if (open) {
          setShowIntercomConsent(false);
          AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
        }
      }}
    >
      <MenuTrigger>
        <div>
          <Tooltip
            content={createMessage(HELP_RESOURCE_TOOLTIP)}
            placement="bottomRight"
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
        </div>
      </MenuTrigger>
      <MenuContent collisionPadding={10} style={{ width: HELP_MODAL_WIDTH }}>
        {showIntercomConsent ? (
          <IntercomConsent showIntercomConsent={setShowIntercomConsent} />
        ) : (
          HELP_MENU_ITEMS.map((item) => (
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
          ))
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
                    cloudHosting,
                  )}
                </span>
                <span>Released {moment(appVersion.releaseDate).fromNow()}</span>
              </HelpFooter>
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}

export default HelpButton;
