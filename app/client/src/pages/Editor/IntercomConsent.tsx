import React from "react";

import {
  CONTINUE,
  INTERCOM_CONSENT_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { updateIntercomConsent, updateUserDetails } from "actions/userActions";
import { Button, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { updateIntercomProperties } from "utils/bootIntercom";

const ConsentContainer = styled.div`
  padding: 10px;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;
export function IntercomConsent({
  showIntercomConsent,
}: {
  showIntercomConsent: (val: boolean) => void;
}) {
  const user = useSelector(getCurrentUser);
  const instanceId = useSelector(getInstanceId);
  const dispatch = useDispatch();

  const sendUserDataToIntercom = () => {
    const { email } = user || {};
    updateIntercomProperties(instanceId, user);
    dispatch(
      updateUserDetails({
        intercomConsentGiven: true,
      }),
    );
    dispatch(updateIntercomConsent());
    showIntercomConsent(false);

    if (user?.enableTelemetry) {
      AnalyticsUtil.identifyUser(user, true);
      AnalyticsUtil.logEvent("SUPPORT_REQUEST_INITIATED", {
        email,
      });
    }

    window.Intercom("show");
  };
  return (
    <ConsentContainer>
      <ActionsRow>
        <Button
          isIconButton
          kind="tertiary"
          onClick={() => showIntercomConsent(false)}
          size="sm"
          startIcon="arrow-left"
        />
      </ActionsRow>
      <div className="mb-3" data-testid="t--intercom-consent-text">
        <Text kind="body-s" renderAs="p">
          {createMessage(INTERCOM_CONSENT_MESSAGE)}
        </Text>
      </div>
      <Button kind="primary" onClick={sendUserDataToIntercom} size="sm">
        {createMessage(CONTINUE)}
      </Button>
    </ConsentContainer>
  );
}
