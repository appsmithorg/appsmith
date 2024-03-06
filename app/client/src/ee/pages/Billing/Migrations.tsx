import React, { useEffect } from "react";
import { StyledPageWrapper } from "../LicenseSetup/styles";
import { Button, Spinner, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  retryPollingForMigration,
  startPollingForMigration,
} from "@appsmith/actions/settingsAction";
import PageHeader from "pages/common/PageHeader";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  MIGRATIONS,
  MIGRATIONS_ERROR_TEXT,
  MIGRATIONS_TEXT,
  RETRY_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { getIsRestartFailed } from "selectors/settingsSelectors";
import styled from "styled-components";
import { isLicenseExpired } from "@appsmith/selectors/tenantSelectors";

const MIGRATIONS_IMAGE = getAssetUrl(`${ASSETS_CDN_URL}/migrations.svg`);

const StyledWrapper = styled.div`
  top: 23%;
  position: absolute;
  width: 100%;
`;

export function Migrations() {
  const dispatch = useDispatch();
  const isRestartFailed = useSelector(getIsRestartFailed);
  const isExpired = useSelector(isLicenseExpired);
  useEffect(() => {
    dispatch(startPollingForMigration(!isExpired));
  }, [isExpired]);

  return (
    <StyledWrapper>
      <PageHeader hideEditProfileLink />
      <StyledPageWrapper>
        <img
          alt={createMessage(MIGRATIONS)}
          className="!h-60"
          loading="lazy"
          src={MIGRATIONS_IMAGE}
        />
        <Text>
          {isRestartFailed
            ? createMessage(MIGRATIONS_ERROR_TEXT)
            : createMessage(MIGRATIONS_TEXT)}
        </Text>
        {!isRestartFailed ? (
          <Spinner size="lg" />
        ) : (
          <Button
            data-testid="btn-refresh"
            onClick={() => dispatch(retryPollingForMigration(true))}
            size="md"
          >
            {createMessage(RETRY_BUTTON)}
          </Button>
        )}
      </StyledPageWrapper>
    </StyledWrapper>
  );
}
