import React, { useEffect } from "react";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
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

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 8px;
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

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <Menu
      onOpenChange={(open) => {
        if (open) {
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
            <Button kind="tertiary" size="md" startIcon="question-line">
              Help
            </Button>
          </Tooltip>
        </div>
      </MenuTrigger>
      <MenuContent collisionPadding={10} style={{ width: HELP_MODAL_WIDTH }}>
        {HELP_MENU_ITEMS.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              if (item.link) window.open(item.link, "_blank");
              if (item.id === "intercom-trigger") {
                if (intercomAppID && window.Intercom) {
                  window.Intercom("show");
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
