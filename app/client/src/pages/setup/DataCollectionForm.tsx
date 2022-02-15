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
import {
  createMessage,
  WELCOME_FORM_DATA_COLLECTION_BODY,
  WELCOME_FORM_DATA_COLLECTION_HEADER,
  WELCOME_FORM_DATA_COLLECTION_LABEL_DISABLE,
  WELCOME_FORM_DATA_COLLECTION_LABEL_ENABLE,
  WELCOME_FORM_DATA_COLLECTION_LINK,
} from "@appsmith/constants/messages";

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
      <FormHeaderWrapper className="relative flex flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">2.</FormHeaderIndex>
        <FormHeaderLabel>
          {createMessage(WELCOME_FORM_DATA_COLLECTION_HEADER)}
        </FormHeaderLabel>
        <FormHeaderSubtext>
          {createMessage(WELCOME_FORM_DATA_COLLECTION_BODY)}
          <br />
          <StyledLink href={TELEMETRY_URL} target="_blank">
            {createMessage(WELCOME_FORM_DATA_COLLECTION_LINK)}
          </StyledLink>
        </FormHeaderSubtext>
      </FormHeaderWrapper>
      <FormBodyWrapper>
        <ControlWrapper>
          <AllowToggleWrapper>
            <AllowToggle>
              <Toggle
                className="t--welcome-form-datacollection"
                name="allowCollectingAnonymousData"
                onToggle={(value) => setAllowCollection(value)}
                value
              />
            </AllowToggle>
            <AllowToggleLabel>
              {allowCollection
                ? createMessage(WELCOME_FORM_DATA_COLLECTION_LABEL_ENABLE)
                : createMessage(WELCOME_FORM_DATA_COLLECTION_LABEL_DISABLE)}
            </AllowToggleLabel>
          </AllowToggleWrapper>
        </ControlWrapper>
      </FormBodyWrapper>
    </DataCollectionFormWrapper>
  );
});
