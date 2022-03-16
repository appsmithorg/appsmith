import React, { useEffect } from "react";
import { InjectedFormProps, reduxForm } from "redux-form";
import { HelpIcons } from "icons/HelpIcons";
import UneditableField from "components/ads/formFields/UneditableField";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import AnalyticsUtil from "utils/AnalyticsUtil";
import TooltipComponent from "../Tooltip";
import { Position } from "@blueprintjs/core";
import {
  createMessage,
  REDIRECT_URL_TOOLTIP,
} from "@appsmith/constants/messages";

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
    margin-left: 4px;
    cursor: pointer;
    svg {
      border-radius: 50%;
      border: 1px solid #858282;
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

function RedirectUrlForm(
  props: InjectedFormProps & { value: string; helpText?: string },
) {
  useEffect(() => {
    props.initialize({
      "redirect-url-form": `${window.location.origin}${props.value}`,
    });
  }, []);

  const handleCopy = (value: string) => {
    copy(value);
    Toaster.show({
      text: "Redirect URL copied to clipboard",
      variant: Variant.success,
    });
    AnalyticsUtil.logEvent("REDIRECT_URL_COPIED", { snippet: value });
  };

  return (
    <Wrapper>
      <HeaderWrapper>
        <HeaderSecondary>Redirect URL</HeaderSecondary>
        <TooltipComponent
          autoFocus={false}
          content={createMessage(REDIRECT_URL_TOOLTIP)}
          hoverOpenDelay={1000}
          minWidth={"180px"}
          openOnTargetFocus={false}
          position={Position.RIGHT}
        >
          <HelpIcon
            className={"help-icon"}
            color={"#858282"}
            height={13}
            width={13}
          />
        </TooltipComponent>
      </HeaderWrapper>
      <BodyContainer>
        <UneditableField
          disabled
          handleCopy={handleCopy}
          helperText={props.helpText}
          iscopy={"true"}
          label={"URL"}
          name={"redirect-url-form"}
        />
      </BodyContainer>
    </Wrapper>
  );
}

export const RedirectUrlReduxForm = reduxForm<any, any>({
  form: "Redirect URL",
  touchOnBlur: true,
})(RedirectUrlForm);
