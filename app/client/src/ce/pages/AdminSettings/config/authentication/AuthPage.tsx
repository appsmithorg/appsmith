import React from "react";
import { useHistory } from "react-router-dom";
import { SettingCategories } from "../types";
import styled from "styled-components";
import Button, { Category } from "components/ads/Button";
import { createMessage, ADD, EDIT } from "constants/messages";
import { getAdminSettingsCategoryUrl } from "constants/routes";
import Icon, { IconSize } from "components/ads/Icon";
import { Callout } from "pages/Settings/Callout";
import Breadcrumbs from "components/ads/Breadcrumbs";
import { IBreadcrumbProps } from "@blueprintjs/core";

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding-left: 112px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div``;

const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
`;

const SettingsSubHeader = styled.div`
  font-size: 14px;
  margin-bottom: 0;
`;

const MethodCard = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0;
`;

const Image = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
  background: #f0f0f0;
  object-fit: cover;
  border-radius: 50%;
  padding: 5px;
  align-self: baseline;
`;

const MethodDetailsWrapper = styled.div`
  color: #2e3d49;
  width: 492px;
  margin-right: 108px;
`;

const MethodTitle = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
`;

const MethodDets = styled.div`
  font-size: 12px;
  line-height: 16px;
`;

export type calloutType = "LINK" | "OTHER";

export type AuthCallout = {
  id: string;
  category?: string;
  label: string;
  subText?: string;
  image?: any;
  needsUpgrade?: boolean;
  type: calloutType;
  isConnected?: boolean;
};

const EditButton = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const ButtonTitle = styled.span`
  margin-right: 2px;
  line-height: 1;
`;

const Label = styled.div`
  display: inline-block;
  color: #fff;
  background: #03b365;
  padding: 2px 6px;
  font-size: 12px;
  margin: 4px 0;
`;

const breadcrumbList: IBreadcrumbProps[] = [
  { href: "/applications", text: "Homepage" },
  { href: "/settings/general", text: "Settings" },
];

export function AuthPage({ authCallouts }: { authCallouts: AuthCallout[] }) {
  const history = useHistory();
  return (
    <Wrapper>
      <Breadcrumbs items={breadcrumbList} />
      <SettingsFormWrapper>
        <SettingsHeader>Select Authentication Method</SettingsHeader>
        <SettingsSubHeader>
          Select a protocol you want to authenticate users with
        </SettingsSubHeader>
        {authCallouts &&
          authCallouts.map((callout) => {
            return (
              <MethodCard key={callout.id}>
                <Image alt={callout.label} src={callout.image} />
                <MethodDetailsWrapper>
                  <MethodTitle>{callout.label}</MethodTitle>
                  {callout.isConnected && <Label>Enabled</Label>}
                  <MethodDets>{callout.subText}</MethodDets>
                  <Callout
                    actionLabel="Learn More"
                    title={"User Emails Ids are not verified."}
                    type="Warning"
                  />
                </MethodDetailsWrapper>
                {callout.isConnected ? (
                  <EditButton
                    onClick={() =>
                      history.push(
                        getAdminSettingsCategoryUrl(
                          SettingCategories.AUTHENTICATION,
                          callout.category,
                        ),
                      )
                    }
                  >
                    <ButtonTitle>{createMessage(EDIT)}</ButtonTitle>
                    <Icon name="right-arrow" size={IconSize.XL} />
                  </EditButton>
                ) : (
                  <Button
                    category={Category.tertiary}
                    className={"add-button"}
                    data-cy="add-auth-account"
                    onClick={() =>
                      history.push(
                        getAdminSettingsCategoryUrl(
                          SettingCategories.AUTHENTICATION,
                          callout.category,
                        ),
                      )
                    }
                    text={createMessage(ADD)}
                  />
                )}
              </MethodCard>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
}
