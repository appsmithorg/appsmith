import React, { useEffect } from "react";
import {
  HeaderWrapper,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "pages/Settings/components";
import SCIM from "assets/images/scim.png";
import styled from "styled-components";
import { Button, Divider, Icon, Text } from "design-system";
import {
  CONFIGURE,
  EDIT,
  PROVISIONING_DESC,
  PROVISIONING_TITLE,
  SCIM_CARD_SUB_TEXT,
  SCIM_CARD_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import { useHistory } from "react-router";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "../config/types";
import { useDispatch, useSelector } from "react-redux";
import { fetchProvisioningStatus } from "@appsmith/actions/provisioningActions";
import { getProvisioningDetails } from "@appsmith/selectors/provisioningSelectors";
import type { MethodType } from "./types";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const ScimCallout: MethodType = {
  id: "APPSMITH_SCIM_PROVISIONING",
  category: "scim",
  label: createMessage(SCIM_CARD_TITLE),
  subText: createMessage(SCIM_CARD_SUB_TEXT),
  image: SCIM,
};

const provisioningMethods = [ScimCallout];

const MethodCard = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0 0;
  padding: 0 8px;

  > .ads-v2-icon {
    margin-right: 8px;
    object-fit: cover;
    border-radius: 50%;
    padding: 5px;
    align-self: baseline;
  }
`;

const Image = styled.img`
  width: 42px;
  padding: 5px 0px;
  margin: 0 8px 0 0;
  align-self: baseline;
`;

const MethodDetailsWrapper = styled.div`
  color: var(--ads-v2-color-fg-muted);
  width: 492px;
  margin-right: 60px;
`;

const MethodTitle = styled(Text)`
  display: flex;
  align-items: center;
  margin: 0 0 4px;
  color: var(--ads-v2-color-fg);

  svg {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
`;

const MethodDets = styled(Text)``;

const ButtonWrapper = styled.div`
  min-width: 100px;
  text-align: right;
`;

export function ActionButton({
  connected,
  method,
}: {
  connected: boolean;
  method: MethodType;
}) {
  const history = useHistory();

  const onClickHandler = (method: MethodType) => {
    if (!connected) {
      AnalyticsUtil.logEvent("SCIM_CONFIGURE_CLICKED");
    }

    history.push(
      adminSettingsCategoryUrl({
        category: SettingCategories.PROVISIONING,
        selected: method.category,
      }),
    );
  };

  return (
    <ButtonWrapper>
      <Button
        className={`t--settings-sub-category-${method.category}`}
        data-testid="t--btn-scim-configure"
        kind={"secondary"}
        onClick={() => onClickHandler(method)}
        size="md"
      >
        {createMessage(connected ? EDIT : CONFIGURE)}
      </Button>
    </ButtonWrapper>
  );
}

export const Provisioning = () => {
  const provisioningDetails = useSelector(getProvisioningDetails);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProvisioningStatus());
  }, []);

  return (
    <Wrapper>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            data-testid="t--provisioning-header"
            kind="heading-l"
            renderAs="h1"
          >
            {createMessage(PROVISIONING_TITLE)}
          </SettingsHeader>
          <SettingsSubHeader
            color="var(--ads-v2-color-fg-emphasis)"
            kind="body-m"
            renderAs="h2"
          >
            {createMessage(PROVISIONING_DESC)}
          </SettingsSubHeader>
        </HeaderWrapper>
        {provisioningMethods &&
          provisioningMethods.map((method) => {
            return (
              <div key={method.id}>
                <MethodCard data-testid="t--method-card">
                  {method.icon ? (
                    <Icon name={method.icon} size="lg" />
                  ) : (
                    <Image alt={method.label} src={method.image} />
                  )}
                  <MethodDetailsWrapper>
                    <MethodTitle
                      color="var(--ads-v2-color-fg)"
                      data-testid="t--method-title"
                      kind="heading-s"
                      renderAs="p"
                    >
                      {method.label}
                    </MethodTitle>
                    <MethodDets
                      color="var(--ads-v2-color-fg)"
                      kind="body-s"
                      renderAs="p"
                    >
                      {method.subText}
                    </MethodDets>
                  </MethodDetailsWrapper>
                  <ActionButton
                    connected={provisioningDetails.configuredStatus}
                    method={method}
                  />
                </MethodCard>
                <Divider />
              </div>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
};

export default Provisioning;
