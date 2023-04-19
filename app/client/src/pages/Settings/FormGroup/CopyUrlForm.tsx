import React, { useEffect } from "react";
import type { InjectedFormProps } from "redux-form";
import { Field, reduxForm } from "redux-form";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { UneditableField } from "design-system-old";
// import { Colors } from "constants/Colors";
import { Icon, toast, Tooltip } from "design-system";

const Wrapper = styled.div`
  margin: 24px 0;
`;

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

function CopyUrlForm(
  props: InjectedFormProps & {
    value: string;
    form: string;
    fieldName: string;
    title: string;
    helpText?: string;
    tooltip?: string;
  },
) {
  useEffect(() => {
    props.initialize({
      [props.fieldName]: `${window.location.origin}${props.value}`,
    });
  }, []);

  const handleCopy = (value: string) => {
    copy(value);
    toast.show(`${props.title} copied to clipboard`, {
      kind: "success",
    });
    AnalyticsUtil.logEvent("URL_COPIED", { snippet: value });
  };

  return (
    <Wrapper>
      <HeaderWrapper>
        <HeaderSecondary>{props.title}</HeaderSecondary>
        {props.tooltip && (
          <Tooltip content={props.tooltip} placement="right" trigger="hover">
            <Icon
              className={"help-icon"}
              color="var(--ads-v2-color-fg)"
              name="question-line"
              size="lg"
            />
          </Tooltip>
        )}
      </HeaderWrapper>
      <BodyContainer>
        <Field
          component={UneditableField}
          disabled
          handleCopy={handleCopy}
          helperText={props.helpText}
          iscopy="true"
          name={props.fieldName}
          {...props}
          asyncControl
        />
      </BodyContainer>
    </Wrapper>
  );
}

export const CopyUrlReduxForm = reduxForm<any, any>({
  touchOnBlur: true,
})(CopyUrlForm);
