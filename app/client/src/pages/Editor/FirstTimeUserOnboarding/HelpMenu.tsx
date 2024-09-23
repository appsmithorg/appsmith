import React from "react";
import { Text, Button } from "@appsmith/ads";
import { getAppsmithConfigs } from "ee/configs";
import { APPSMITH_DISPLAY_VERSION, createMessage } from "ee/constants/messages";
import moment from "moment";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { IntercomConsent } from "../HelpButton";
import classNames from "classnames";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

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
    link: DOCS_BASE_URL,
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

const StyledText = styled(Text)`
  font-size: 8px;
  font-weight: normal;
`;

const HelpFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function HelpMenu(props: {
  setShowIntercomConsent: (val: boolean) => void;
  showIntercomConsent: boolean;
}) {
  const user = useSelector(getCurrentUser);

  return (
    <div
      className={classNames({
        "mt-3.5": !props.showIntercomConsent,
        "flex-1": true,
      })}
    >
      {props.showIntercomConsent ? (
        <IntercomConsent showIntercomConsent={props.setShowIntercomConsent} />
      ) : (
        <>
          <Text
            color="var(--ads-v2-color-bg-brand-secondary)"
            kind="heading-xs"
          >
            Help & Resources
          </Text>
          <div className="flex flex-wrap gap-2 mt-2">
            {HELP_MENU_ITEMS.map((item) => {
              return (
                <Button
                  key={item.label}
                  kind="secondary"
                  // TODO: Fix this the next time the file is edited
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(e: any) => {
                    if (item.link) {
                      window.open(item.link, "_blank");
                    }

                    if (item.id === "intercom-trigger") {
                      e?.preventDefault();

                      if (intercomAppID && window.Intercom) {
                        if (user?.isIntercomConsentGiven || cloudHosting) {
                          window.Intercom("show");
                        } else {
                          props.setShowIntercomConsent(true);
                        }
                      }
                    }
                  }}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </>
      )}
      {appVersion.id && (
        <HelpFooter className="mt-2">
          <StyledText color="var(--ads-v2-color-fg-muted)" kind={"action-s"}>
            {createMessage(
              APPSMITH_DISPLAY_VERSION,
              appVersion.edition,
              appVersion.id,
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
