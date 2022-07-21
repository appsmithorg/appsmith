import React, { useEffect } from "react";
import { InjectedFormProps, reduxForm } from "redux-form";
import { HelpIcons } from "icons/HelpIcons";
import UneditableField from "components/ads/formFields/UneditableField";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { TooltipComponent } from "design-system";
import { Colors } from "constants/Colors";

const HelpIcon = HelpIcons.HELP_ICON;

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
  .help-icon {
    margin-left: 8px;
    cursor: pointer;
    svg {
      border-radius: 50%;
      border: 1px solid ${Colors.GREY_7};
      padding: 1px;
    }
  }
`;

export const HeaderSecondary = styled.h3`
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.23999999463558197px;
  text-align: left;
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
    Toaster.show({
      text: `${props.title} copied to clipboard`,
      variant: Variant.success,
    });
    AnalyticsUtil.logEvent("URL_COPIED", { snippet: value });
  };

  return (
    <Wrapper>
      <HeaderWrapper>
        <HeaderSecondary>{props.title}</HeaderSecondary>
        {props.tooltip && (
          <TooltipComponent
            autoFocus={false}
            content={props.tooltip}
            hoverOpenDelay={0}
            minWidth={"180px"}
            openOnTargetFocus={false}
            position="right"
          >
            <HelpIcon
              className={"help-icon"}
              color={Colors.GREY_7}
              height={13}
              width={13}
            />
          </TooltipComponent>
        )}
      </HeaderWrapper>
      <BodyContainer>
        <UneditableField
          disabled
          handleCopy={handleCopy}
          helperText={props.helpText}
          iscopy={"true"}
          name={props.fieldName}
        />
      </BodyContainer>
    </Wrapper>
  );
}

export const CopyUrlReduxForm = reduxForm<any, any>({
  touchOnBlur: true,
})(CopyUrlForm);
