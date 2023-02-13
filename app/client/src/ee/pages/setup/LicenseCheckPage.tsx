import React from "react";
import {
  Category,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
} from "design-system-old";
import {
  ACTIVATE_INSTANCE,
  ADD_KEY,
  createMessage,
  GET_STARTED_MESSAGE,
  GET_TRIAL_LICENSE,
  LICENSE_KEY_CTA_LABEL,
  LICENSE_KEY_FORM_INPUT_LABEL,
  NO_ACTIVE_SUBSCRIPTION,
  LICENSE_ERROR_TITLE,
  LICENSE_ERROR_DESCRIPTION,
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
import { useSelector } from "react-redux";
import { isAdminUser } from "@appsmith/selectors/tenantSelectors";
import PageHeader from "pages/common/PageHeader";
import Page from "pages/common/ErrorPages/Page";
import styled from "styled-components";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

const StyledIcon = styled(Icon)`
  transform: scale(1.5);
  margin-bottom: 15px;
`;

function LicenseCheckPage() {
  const showLicenseUpdateForm = useSelector(isAdminUser);

  if (!showLicenseUpdateForm) {
    return (
      <>
        <PageHeader hideEditProfileLink />
        <Page
          description={createMessage(LICENSE_ERROR_DESCRIPTION)}
          errorIcon={<StyledIcon name="warning-line" />}
          title={createMessage(LICENSE_ERROR_TITLE)}
        />
      </>
    );
  } else {
    return (
      <>
        <PageHeader hideEditProfileLink />
        <StyledPageWrapper>
          <StyledBannerWrapper>
            <img
              alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
              className="no-sub-img"
              loading="lazy"
              src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
              width="180"
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
                <Icon name="arrow-up-line" size={IconSize.XXXXL} />
              </IconBadge>
              <StyledContent>
                {createMessage(LICENSE_KEY_CTA_LABEL)}
              </StyledContent>
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
      </>
    );
  }
}

export default requiresAuth(LicenseCheckPage);
