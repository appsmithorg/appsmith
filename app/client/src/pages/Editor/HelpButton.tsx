import React from "react";
import styled from "styled-components";
import { Popover, Position } from "@blueprintjs/core";

import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";
import Icon from "components/ads/Icon";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledTrigger = styled.div`
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: 1px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  & span {
    left: 1px;
    position: relative;
  }
`;

const Trigger = () => (
  <StyledTrigger>
    <Icon name="help" />
  </StyledTrigger>
);

const onOpened = () => {
  AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
};
const HelpButton = () => {
  return (
    <Popover
      modifiers={{
        offset: {
          enabled: true,
          offset: "0, 6",
        },
      }}
      minimal
      position={Position.BOTTOM}
      onOpened={onOpened}
    >
      <Trigger />
      <div style={{ width: HELP_MODAL_WIDTH }}>
        <DocumentationSearch hitsPerPage={4} />
      </div>
    </Popover>
  );
};

export default HelpButton;
