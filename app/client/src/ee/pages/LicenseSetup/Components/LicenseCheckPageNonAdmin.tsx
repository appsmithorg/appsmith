import PageHeader from "pages/common/PageHeader";
import { StyledNonAdminPageWrapper, StyledPageWrapper } from "../styles";
import React from "react";
import {
  LICENSE_ERROR_DESCRIPTION,
  NO_ACTIVE_SUBSCRIPTION,
  createMessage,
} from "@appsmith/constants/messages";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Text } from "design-system";

const NO_LICENSE_NON_ADMIN = getAssetUrl(
  `${ASSETS_CDN_URL}/license-expired-non-admin.svg`,
);

function LicenseCheckPageNonAdmin() {
  return (
    <StyledNonAdminPageWrapper>
      <PageHeader hideEditProfileLink />
      <StyledPageWrapper>
        {
          <img
            alt={createMessage(NO_ACTIVE_SUBSCRIPTION)}
            loading="lazy"
            src={NO_LICENSE_NON_ADMIN}
          />
        }
        <Text
          color="var(--ads-v2-color-fg-emphasis)"
          data-testid="t--secondary-header-text"
          renderAs="p"
        >
          {createMessage(LICENSE_ERROR_DESCRIPTION)}
        </Text>
      </StyledPageWrapper>
    </StyledNonAdminPageWrapper>
  );
}

export default LicenseCheckPageNonAdmin;
