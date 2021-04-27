import React from "react";
import styled from "styled-components";
import NoSearchDataImage from "assets/images/no_search_data.png";
import { NO_SEARCH_DATA_TEXT } from "constants/messages";
import { getTypographyByKey } from "constants/DefaultTheme";
import { ReactComponent as DiscordIcon } from "assets/icons/help/discord.svg";

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
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }

  .discord-link {
    cursor: pointer;
    color: white;
    font-weight: 700;
  }
`;

const StyledDiscordIcon = styled(DiscordIcon)`
  path {
    fill: #5c6bc0;
  }
  vertical-align: -7px;
`;

function ResultsNotFound() {
  return (
    <Container>
      <img alt="No data" src={NoSearchDataImage} />
      <div className="no-data-title">{NO_SEARCH_DATA_TEXT()}</div>
      <span className="discord">
        🤖 Join our{"  "}
        <span
          className="discord-link"
          onClick={() => {
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
        >
          <StyledDiscordIcon color="red" height={22} width={24} />
          Discord Server
        </span>{" "}
        for more help.
      </span>
    </Container>
  );
}

export default ResultsNotFound;
