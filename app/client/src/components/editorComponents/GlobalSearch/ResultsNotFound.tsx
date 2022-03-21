import React from "react";
import styled from "styled-components";
import NoSearchDataImage from "assets/images/no_search_data.png";
import { NO_SEARCH_DATA_TEXT } from "@appsmith/constants/messages";
import { getTypographyByKey } from "constants/DefaultTheme";
import { ReactComponent as DiscordIcon } from "assets/icons/help/discord.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "ce/configs";
import { Button, Category, Icon, IconPositions } from "components/ads";

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  ${(props) => getTypographyByKey(props, "spacedOutP1")}
  color: ${(props) => props.theme.colors.globalSearch.emptyStateText};

  .no-data-title {
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }

  .discord {
    margin: ${(props) => props.theme.spaces[3]}px 0;
    display: flex;
    gap: 0.25rem;
  }

  .discord-link {
    cursor: pointer;
    display: flex;
    color: ${(props) => props.theme.colors.globalSearch.searchItemText};
    font-weight: 700;
  }
  .intercom {
    margin: 1rem 0;
  }
`;

const StyledDiscordIcon = styled(DiscordIcon)`
  path {
    fill: #5c6bc0;
  }
  vertical-align: -7px;
`;

const { intercomAppID } = getAppsmithConfigs();

function ResultsNotFound() {
  return (
    <Container>
      <img alt="No data" src={NoSearchDataImage} />
      <div className="no-data-title">{NO_SEARCH_DATA_TEXT()}</div>
      {(intercomAppID && window.Intercom) || true ? (
        <Button
          category={Category.tertiary}
          className="intercom"
          height="40"
          iconPosition={IconPositions.left}
          onClick={() => {
            window.Intercom("show");
            AnalyticsUtil.logEvent("INTERCOM_CLICK", {
              from: "OMNIBAR",
            });
          }}
          text="Chat with us"
          type="button"
          width="100"
        />
      ) : (
        <span className="discord">
          🤖 Join our{"  "}
          <span
            className="discord-link"
            onClick={() => {
              window.open("https://discord.gg/rBTTVJp", "_blank");
              AnalyticsUtil.logEvent("DISCORD_LINK_CLICK");
            }}
          >
            <StyledDiscordIcon color="red" height={22} width={24} />
            Discord Server
          </span>{" "}
          for more help.
        </span>
      )}
    </Container>
  );
}

export default ResultsNotFound;
