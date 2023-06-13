import React from "react";
import { Text, Button } from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  APPSMITH_DISPLAY_VERSION,
  createMessage,
} from "@appsmith/constants/messages";
import moment from "moment";
import styled from "styled-components";
import { triggerWelcomeTour } from "./Utils";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

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

const StyledText = styled(Text)`
  font-size: 8px;
  font-weight: normal;
`;

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function HelpMenu() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);

  return (
    <div className="mt-7">
      <Text color="var(--ads-v2-color-bg-brand-secondary)">
        Help & Resources
      </Text>
      <div className="flex gap-2 flex-wrap mt-2">
        <Button
          kind="secondary"
          onClick={() => triggerWelcomeTour(dispatch, applicationId)}
          startIcon={"guide"}
        >
          Try guided tour
        </Button>
        {HELP_MENU_ITEMS.map((item) => {
          return (
            <Button
              key={item.label}
              kind="secondary"
              onClick={() => {
                if (item.link) {
                  window.open(item.link, "_blank");
                }
                if (item.id === "intercom-trigger") {
                  // TODO
                  //   e?.preventDefault();
                  //   if (intercomAppID && window.Intercom) {
                  //     if (user?.isIntercomConsentGiven || cloudHosting) {
                  //       window.Intercom("show");
                  //     } else {
                  //       setShowIntercomConsent(true);
                  //     }
                  //   }
                }
              }}
              startIcon={item.icon}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
      {appVersion.id && (
        <HelpFooter className="mt-2">
          <StyledText color="var(--ads-v2-color-fg-muted)" kind={"action-s"}>
            {createMessage(
              APPSMITH_DISPLAY_VERSION,
              appVersion.edition,
              appVersion.id,
              cloudHosting,
            )}
          </StyledText>
          <StyledText color="var(--ads-v2-color-fg-muted)" kind={"action-s"}>
            Released {moment(appVersion.releaseDate).fromNow()}
          </StyledText>
        </HelpFooter>
      )}
    </div>
  );
}

export default HelpMenu;
