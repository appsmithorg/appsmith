import React, { useMemo } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Icon, Input, toast, Tooltip } from "design-system";

export const BodyContainer = styled.div`
  width: 100%;
  padding: 0 0 16px;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--ads-v2-color-fg);
  .help-icon {
    margin-left: 8px;
    cursor: pointer;
  }
`;

export const HeaderSecondary = styled.h3`
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.23999999463558197px;
  text-align: left;
  color: var(--ads-v2-color-fg-emphasis);
`;

function CopyUrlForm(props: {
  value: string;
  title: string;
  helpText?: string;
  tooltip?: string;
}) {
  const fieldValue = useMemo(
    () => `${window.location.origin}${props.value}`,
    [props.value],
  );

  const handleCopy = () => {
    copy(fieldValue);
    toast.show(`${props.title} copied to clipboard`, {
      kind: "success",
    });
    AnalyticsUtil.logEvent("URL_COPIED", { snippet: fieldValue });
  };

  return (
    <div>
      <HeaderWrapper>
        <HeaderSecondary>{props.title}</HeaderSecondary>
        {props.tooltip && (
          <Tooltip content={props.tooltip} placement="right" trigger="hover">
            <Icon
              className={"help-icon"}
              color="var(--ads-v2-color-fg)"
              name="question-line"
              size="md"
            />
          </Tooltip>
        )}
      </HeaderWrapper>
      <BodyContainer>
        <Input
          description={props.helpText}
          endIcon="copy-control"
          endIconProps={{
            onClick: handleCopy,
          }}
          isDisabled
          isReadOnly
          size="md"
          value={fieldValue}
        />
      </BodyContainer>
    </div>
  );
}

export default CopyUrlForm;
