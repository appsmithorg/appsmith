import React from "react";
import { Text, Link, Button, Icon } from "design-system";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import {
  RAMP_NAME,
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import { useSelector } from "react-redux";
import {
  getRampLink,
  showProductRamps,
} from "@appsmith/selectors/rampSelectors";
import BusinessTag from "components/BusinessTag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

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

export function PrivateEmbedRampModal() {
  const rampLinkSelector = getRampLink({
    section: RampSection.ShareModal,
    feature: RampFeature.PrivateEmbeds,
  });
  const rampLink = useSelector(rampLinkSelector);
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );
  const showRampSelector = showProductRamps(
    RAMP_NAME.PRIVATE_EMBED,
    false,
    isPrivateEmbedEnabled,
  );
  const canShowRamp = useSelector(showRampSelector);
  if (canShowRamp) {
    return (
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 w-4/5">
          <div className="flex">
            <Icon className="mr-1" name="lock-2-line" size="md" />
            <Text kind="body-m">
              {createMessage(IN_APP_EMBED_SETTING.privateAppsText)}
            </Text>
            <BusinessTag classes="ml-1 mt-0.5" />
          </div>
          <Text
            className="w-7/10 block"
            color="var(--ads-v2-color-fg-muted)"
            data-testid="t--private-embed-settings-ramp"
            kind="body-s"
          >
            {createMessage(IN_APP_EMBED_SETTING.rampSubtextModal)}
          </Text>
        </div>
        <Link
          data-testid="t--private-embed-ramp-link"
          kind="secondary"
          startIcon="share-box-line"
          to={rampLink}
        >
          {createMessage(IN_APP_EMBED_SETTING.rampLinktext)}
        </Link>
      </div>
    );
  }
  return null;
}
export function PrivateEmbedRampSidebar() {
  const rampLinkSelector = getRampLink({
    section: RampSection.AppSettings,
    feature: RampFeature.PrivateEmbeds,
  });
  const rampLink = useSelector(rampLinkSelector);
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );
  const showRampSelector = showProductRamps(
    RAMP_NAME.PRIVATE_EMBED,
    false,
    isPrivateEmbedEnabled,
  );
  const canShowRamp = useSelector(showRampSelector);
  if (canShowRamp) {
    return (
      <div className="mt-6" data-testid="t--private-embed-settings-ramp">
        <Text kind="body-m">
          {createMessage(IN_APP_EMBED_SETTING.rampSubtextSidebar)}
        </Text>
        <Link
          className="!inline"
          data-testid="t--private-embed-ramp-link"
          kind="primary"
          to={rampLink}
        >
          {createMessage(IN_APP_EMBED_SETTING.rampLinktextvariant2)}
        </Link>
      </div>
    );
  }
  return null;
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
      <div className="flex flex-col">
        <Text kind="body-m" renderAs="p">
          {canMakeAppPublic
            ? createMessage(IN_APP_EMBED_SETTING.secondaryHeadingForAppSettings)
            : createMessage(IN_APP_EMBED_SETTING.secondaryHeading)}
        </Text>
        <PrivateEmbedRampSidebar />
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
    <div className="flex flex-col gap-6">
      <div
        className="flex gap-1 justify-between items-start"
        data-testid="t--upgrade-content"
      >
        <div className="flex flex-col gap-1 items-start">
          <div className="flex">
            <Icon className="mr-1" name="global-line" size="md" />
            <Text kind="body-m">
              {createMessage(IN_APP_EMBED_SETTING.upgradeHeadingForInviteModal)}
            </Text>
          </div>
          <Text
            className={canMakeAppPublic ? "w-7/10" : ""}
            color="var(--ads-v2-color-fg-muted)"
            kind="body-s"
          >
            {createMessage(
              canMakeAppPublic
                ? IN_APP_EMBED_SETTING.upgradeSubheadingForInviteModal
                : IN_APP_EMBED_SETTING.upgradeHeading,
            )}
          </Text>
        </div>

        {canMakeAppPublic && (
          <Button
            data-testid="t--share-settings-btn"
            onClick={changeTab}
            size="sm"
          >
            Share settings
          </Button>
        )}
      </div>
      <PrivateEmbedRampModal />
    </div>
  );
}
