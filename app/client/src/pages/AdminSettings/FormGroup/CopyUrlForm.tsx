import React, { useMemo } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Icon, Input, Text, toast, Tooltip } from "@appsmith/ads";

export const BodyContainer = styled.div`
  width: 100%;
  padding: 0 0 16px;
  .ads-v2-input__input-section-input,
  .ads-v2-input__input-section-icon[data-has-onclick="true"],
  .ads-v2-input__input-section-icon[data-has-onclick="true"] * {
    cursor: pointer !important;
  }
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  color: var(--ads-v2-color-fg);

  .title-text {
    font-weight: var(--ads-v2-h5-font-weight);
  }

  .help-icon {
    margin-left: 8px;
    cursor: pointer;
  }
`;

function CopyUrlForm(props: {
  value: string;
  title: React.ReactNode;
  helpText?: string;
  tooltip?: string;
  fieldName?: string;
  startIcon?: string;
  append?: boolean;
}) {
  const {
    append = true,
    fieldName,
    helpText,
    startIcon,
    title,
    tooltip,
  } = props;

  const fieldValue = useMemo(
    () => `${append ? window.location.origin : ""}${props.value}`,
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
        data-testid={`${fieldName}-input`}
        {...(helpText ? { description: `* ${helpText}` } : {})}
        endIcon="duplicate"
        endIconProps={{
          className: "copy-icon",
          // @ts-expect-error Fix this the next time the file is edited
          "data-testid": `${fieldName}-copy-icon`,
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
              {title}
            </Text>
            {tooltip && (
              <Tooltip content={tooltip} placement="right" trigger="hover">
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
        name={fieldName}
        onClick={handleCopy}
        size="md"
        {...(startIcon ? { startIcon } : {})}
        value={fieldValue}
      />
    </BodyContainer>
  );
}

export default CopyUrlForm;
