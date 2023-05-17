import React, { useMemo } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Icon, Input, Text, toast, Tooltip } from "design-system";

export const BodyContainer = styled.div`
  width: 100%;
  padding: 0 0 16px;
  .ads-v2-input__input-section-icon[data-has-onclick="true"] * {
    cursor: pointer !important;
  }
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  color: var(--ads-v2-color-fg);
  .help-icon {
    margin-left: 8px;
    cursor: pointer;
  }
`;

function CopyUrlForm(props: {
  value: string;
  title: string;
  helpText?: string;
  tooltip?: string;
  fieldName?: string;
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
    <BodyContainer>
      <Input
        description={`* ${props.helpText}`}
        endIcon="duplicate"
        endIconProps={{
          className: "copy-icon",
          onClick: handleCopy,
        }}
        isReadOnly
        label={
          <HeaderWrapper>
            <Text
              className="title-text"
              color="var(--ads-v2-color-fg)"
              kind="body-m"
              renderAs="label"
            >
              {props.title}
            </Text>
            {props.tooltip && (
              <Tooltip
                content={props.tooltip}
                placement="right"
                trigger="hover"
              >
                <Icon
                  className={"help-icon"}
                  color="var(--ads-v2-color-fg)"
                  name="question-line"
                  size="md"
                />
              </Tooltip>
            )}
          </HeaderWrapper>
        }
        name={props.fieldName}
        size="md"
        value={fieldValue}
      />
    </BodyContainer>
  );
}

export default CopyUrlForm;
