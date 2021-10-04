import React, { memo, useState } from "react";
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
  const [allowCollection, setAllowCollection] = useState(true);
  return (
    <DataCollectionFormWrapper>
      <FormHeaderWrapper>
        <FormHeaderIndex>2.</FormHeaderIndex>
        <FormHeaderLabel>Usage data preference</FormHeaderLabel>
        <FormHeaderSubtext>
          Share anonymous usage data to help improve the product. <br />
          <StyledLink href={TELEMETRY_URL} target="_blank">
            See what is shared
          </StyledLink>
        </FormHeaderSubtext>
      </FormHeaderWrapper>
      <FormBodyWrapper>
        <ControlWrapper>
          <AllowToggleWrapper>
            <AllowToggle>
              <Toggle
                name="allowCollectingAnonymousData"
                onToggle={(value) => setAllowCollection(value)}
                value
              />
            </AllowToggle>
            <AllowToggleLabel>
              {allowCollection
                ? "Share data & make Appsmith better!"
                : "Don't share any data"}
            </AllowToggleLabel>
          </AllowToggleWrapper>
        </ControlWrapper>
      </FormBodyWrapper>
    </DataCollectionFormWrapper>
  );
});
