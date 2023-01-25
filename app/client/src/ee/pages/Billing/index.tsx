import React, { useEffect } from "react";
import { IconSize, Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useDispatch, useSelector } from "react-redux";
import { getAllAclUsers } from "@appsmith/selectors/aclSelectors";
import {
  ADMIN_BILLING_SETTINGS_SUBTITLE,
  ADMIN_BILLING_SETTINGS_TITLE,
  BILLING_AND_USAGE,
  createMessage,
  NUMBER_OF_SELF_HOSTED_USERS,
  OPEN_CUSTOMER_PORTAL,
  TOTAL_USERS_MESSAGE,
} from "@appsmith/constants/messages";
import { BillingPageHeader } from "./Header";
import { BillingPageWrapper, HeaderText, UserCount } from "./styles";
import { BillingPageContent } from "./BillingPageContent";
import { CtaText } from "./CTAText";
import { BillingDashboardCard, CTATextType } from "./types";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";

const headerProps = {
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
  subtitle: createMessage(ADMIN_BILLING_SETTINGS_SUBTITLE),
};

const CtaConfig: CTATextType = {
  action: goToCustomerPortal,
  icon: {
    fillColor: Colors.PURPLE,
    name: "arrow-forward",
    size: IconSize.XXL,
  },
  text: createMessage(OPEN_CUSTOMER_PORTAL).toLocaleUpperCase(),
};

export function Billing() {
  const dispatch = useDispatch();
  useEffect(() => {
    // API call to get the total users
    dispatch({ type: ReduxActionTypes.FETCH_ACL_USERS });
  }, []);

  const TOTAL_USERS = useSelector(getAllAclUsers)?.length;

  const cards: BillingDashboardCard[] = [
    {
      icon: "group-line",
      title: (
        <HeaderText type={TextType.H3} weight="700">
          {createMessage(TOTAL_USERS_MESSAGE)}
        </HeaderText>
      ),
      subtitle: (
        <Text type={TextType.P1}>
          {createMessage(NUMBER_OF_SELF_HOSTED_USERS)}
        </Text>
      ),
      value: (
        <UserCount type={TextType.H1} weight="600">
          {TOTAL_USERS}
        </UserCount>
      ),
    },
    {
      icon: "upgrade",
      title: (
        <HeaderText type={TextType.H3} weight="700">
          {createMessage(BILLING_AND_USAGE)}
        </HeaderText>
      ),
      subtitle: <CtaText {...CtaConfig} />,
    },
  ];

  return (
    <BillingPageWrapper>
      <BillingPageHeader {...headerProps} />
      <BillingPageContent cards={cards} />
    </BillingPageWrapper>
  );
}
