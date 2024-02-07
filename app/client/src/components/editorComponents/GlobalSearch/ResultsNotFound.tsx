import React from "react";
import styled from "styled-components";
import NoSearchDataImage from "assets/images/no_search_data.png";
import { NO_SEARCH_DATA_TEXT } from "@appsmith/constants/messages";
import { getTypographyByKey } from "design-system-old";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { importSvg } from "design-system-old";
import { Button } from "design-system";

const DiscordIcon = importSvg(
  async () => import("assets/icons/help/discord.svg"),
);

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  ${getTypographyByKey("spacedOutP1")}
  color: ${(props) => props.theme.colors.globalSearch.emptyStateText};

  .no-data-title {
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }
`;

const StyledDiscordIcon = styled(DiscordIcon)`
  path {
    fill: #5c6bc0;
  }
  vertical-align: -7px;
`;

function ResultsNotFound() {
  const isAirgappedInstance = isAirgapped();
  return (
    <Container>
      <img alt="No data" src={NoSearchDataImage} />
      <div className="no-data-title">{NO_SEARCH_DATA_TEXT()}</div>
      {!isAirgappedInstance && (
        <Button
            kind="secondary"
            onClick={() => window.Intercom && window.Intercom('show')}
            startIcon="chat-help">
              Chat with us on Intercom
        </Button>
      )}
    </Container>
  );
}

export default React.memo(ResultsNotFound);
