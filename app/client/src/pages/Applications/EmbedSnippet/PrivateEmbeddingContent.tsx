import React from "react";
import { useSelector } from "react-redux";
import { Text, Link, Button } from "design-system";
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import styled from "styled-components";

const StyledLink = styled(Link)`
  text-decoration: underline !important;
  display: inline;
`;

function PrivateEmbeddingContent(props: {
  userAppPermissions: any[];
  changeTab?: () => void;
  isAppSettings?: boolean;
}) {
  const { changeTab, isAppSettings = false } = props;

  const canMakeAppPublic = isPermitted(
    props.userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );

  if (isAppSettings)
    return <AppSettingsContent canMakeAppPublic={canMakeAppPublic} />;

  return (
    <SnippetTabContent
      canMakeAppPublic={canMakeAppPublic}
      changeTab={changeTab}
    />
  );
}

export default PrivateEmbeddingContent;

function EmbeddedLink() {
  const appsmithConfigs = getAppsmithConfigs();
  const instanceId = useSelector(getInstanceId);

  return (
    <Text kind="action-m">
      {createMessage(IN_APP_EMBED_SETTING.upgradeContent)}&nbsp;
      <StyledLink
        onClick={() => {
          window.open(
            PRICING_PAGE_URL(
              appsmithConfigs.pricingUrl,
              appsmithConfigs.cloudHosting ? "Cloud" : "CE",
              instanceId,
            ),
            "_blank",
          );
        }}
        rel="noreferrer"
        to="#"
      >
        {createMessage(IN_APP_EMBED_SETTING.appsmithBusinessEdition)}
      </StyledLink>
    </Text>
  );
}

function AppSettingsContent({
  canMakeAppPublic,
}: {
  canMakeAppPublic: boolean;
}) {
  return (
    <div className="px-4" data-testid="t--upgrade-content">
      <Text className="pt-3 pb-3" kind="heading-xs" renderAs="p">
        {createMessage(IN_APP_EMBED_SETTING.embed)}
      </Text>
      <div className="flex flex-col gap-1">
        <Text kind="action-m" renderAs="p">
          {canMakeAppPublic
            ? createMessage(IN_APP_EMBED_SETTING.secondaryHeadingForAppSettings)
            : createMessage(IN_APP_EMBED_SETTING.secondaryHeading)}
        </Text>

        <EmbeddedLink />
      </div>
    </div>
  );
}

function SnippetTabContent({
  canMakeAppPublic,
  changeTab,
}: {
  canMakeAppPublic: boolean;
  changeTab?: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-1 items-start"
      data-testid="t--upgrade-content"
    >
      <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-s">
        {canMakeAppPublic
          ? createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForInviteModal)
          : createMessage(IN_APP_EMBED_SETTING.upgradeHeading)}
      </Text>

      <EmbeddedLink />

      {canMakeAppPublic && (
        <Button
          className="mt-2"
          data-testid="t--share-settings-btn"
          onClick={changeTab}
          size="md"
        >
          Share settings
        </Button>
      )}
    </div>
  );
}
