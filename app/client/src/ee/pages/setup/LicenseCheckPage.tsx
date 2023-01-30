import React from "react";
import {
  Category,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
} from "design-system-old";
import AppsmithImage from "assets/images/appsmith_logo_square.png";
import {
  ACTIVATE_INSTANCE,
  ADD_KEY,
  createMessage,
  GET_STARTED_MESSAGE,
  GET_TRIAL_LICENSE,
  LICENSE_KEY_CTA_LABEL,
  LICENSE_KEY_FORM_INPUT_LABEL,
  NO_ACTIVE_SUBSCRIPTION,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import {
  StyledPageWrapper,
  StyledBannerWrapper,
  StyledCardWrapper,
  StyledContent,
  StyledButton,
  StyledCard,
  IconBadge,
} from "./styles";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import { LicenseForm } from "./LicenseForm";

function LicenseCheckPage() {
  return (
    <StyledPageWrapper>
      <StyledBannerWrapper>
        <img
          alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
          className="no-sub-img"
          height="657"
          src={AppsmithImage}
          width="177"
        />
        <Text type={TextType.H1} weight="600">
          {createMessage(NO_ACTIVE_SUBSCRIPTION)}
        </Text>
        <Text type={TextType.P1}>{createMessage(GET_STARTED_MESSAGE)}</Text>
      </StyledBannerWrapper>
      <StyledCardWrapper>
        <StyledCard>
          <IconBadge>
            <Icon name="key-2-line" size={IconSize.XXXXL} />
          </IconBadge>
          <LicenseForm
            actionBtnText={createMessage(ACTIVATE_INSTANCE)}
            label={createMessage(LICENSE_KEY_FORM_INPUT_LABEL)}
            placeholder={createMessage(ADD_KEY)}
          />
        </StyledCard>
        <StyledCard noField>
          <IconBadge>
            <Icon name="arrow-right-up-line" size={IconSize.XXXXL} />
          </IconBadge>
          <StyledContent>{createMessage(LICENSE_KEY_CTA_LABEL)}</StyledContent>
          <StyledButton
            category={Category.secondary}
            icon="share-2"
            iconPosition="left"
            onClick={goToCustomerPortal}
            size={Size.large}
            tag="button"
            text={createMessage(GET_TRIAL_LICENSE)}
            type="button"
          />
        </StyledCard>
      </StyledCardWrapper>
    </StyledPageWrapper>
  );
}

export default requiresAuth(LicenseCheckPage);
