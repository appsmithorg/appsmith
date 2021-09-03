import { noop } from "lodash";
import React, { memo } from "react";
import styled from "styled-components";
import Toggle from "components/ads/Toggle";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import {
  AllowToggle,
  AllowToggleLabel,
  AllowToggleWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderSubtext,
  FormHeaderWrapper,
  StyledLink as Link,
} from "./common";
import { TELEMETRY_URL } from "constants/ThirdPartyConstants";

const DataCollectionFormWrapper = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
`;

const StyledLink = styled(Link)`
  display: inline-block;
  margin-top: 8px;
`;

export default memo(function DataCollectionForm() {
  return (
    <DataCollectionFormWrapper>
      <FormHeaderWrapper>
        <FormHeaderIndex>2.</FormHeaderIndex>
        <FormHeaderLabel>Usage data preference</FormHeaderLabel>
        <FormHeaderSubtext>
          Data is collected anonymously to improve your experience. <br />
          <StyledLink href={TELEMETRY_URL} target="_blank">
            List of tracked items
          </StyledLink>
        </FormHeaderSubtext>
      </FormHeaderWrapper>
      <FormBodyWrapper>
        <ControlWrapper>
          <AllowToggleWrapper>
            <AllowToggle>
              <Toggle
                name="allowCollectingAnonymousData"
                onToggle={() => noop}
                value
              />
            </AllowToggle>
            <AllowToggleLabel>
              Allow Appsmith to collect usage data anonymously
            </AllowToggleLabel>
          </AllowToggleWrapper>
        </ControlWrapper>
      </FormBodyWrapper>
    </DataCollectionFormWrapper>
  );
});
