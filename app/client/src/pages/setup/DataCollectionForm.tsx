import React, { memo, useState } from "react";
import styled from "styled-components";
import { Switch, Link } from "design-system";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import {
  AllowToggle,
  AllowToggleWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderSubtext,
} from "./common";
import { TELEMETRY_URL } from "constants/ThirdPartyConstants";
import {
  createMessage,
  WELCOME_FORM_DATA_COLLECTION_BODY,
  WELCOME_FORM_DATA_COLLECTION_HEADER,
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
      <div className="relative flex flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">2.</FormHeaderIndex>
        <FormHeaderLabel>
          {createMessage(WELCOME_FORM_DATA_COLLECTION_HEADER)}
        </FormHeaderLabel>
        <FormHeaderSubtext>
          {createMessage(WELCOME_FORM_DATA_COLLECTION_BODY)}
          <br />
          <StyledLink kind="primary" target="_blank" to={TELEMETRY_URL}>
            {createMessage(WELCOME_FORM_DATA_COLLECTION_LINK)}
          </StyledLink>
        </FormHeaderSubtext>
      </div>
      <FormBodyWrapper>
        <ControlWrapper>
          <AllowToggleWrapper>
            <AllowToggle>
              <Switch
                className="t--welcome-form-datacollection"
                isSelected={allowCollection}
                name="allowCollectingAnonymousData"
                onChange={(value: boolean) => setAllowCollection(value)}
                value={allowCollection.toString()}
              >
                {createMessage(WELCOME_FORM_DATA_COLLECTION_LABEL_ENABLE)}
              </Switch>
            </AllowToggle>
          </AllowToggleWrapper>
        </ControlWrapper>
      </FormBodyWrapper>
    </DataCollectionFormWrapper>
  );
});
