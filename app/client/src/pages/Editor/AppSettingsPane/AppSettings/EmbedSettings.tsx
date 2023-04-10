import { changeAppViewAccessInit } from "@appsmith/actions/applicationActions";
import { Switch, Link, Divider, Icon } from "design-system";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsChangingViewAccess,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import styled from "styled-components";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "pages/Applications/EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
  MAKE_APPLICATION_PUBLIC,
} from "@appsmith/constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

const Title = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1.2rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

const Text = styled.p`
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
`;

function EmbedSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const isChangingViewAccess = useSelector(getIsChangingViewAccess);
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const embedSnippet = useUpdateEmbedSnippet();
  const userAppPermissions = application?.userPermissions ?? [];
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );

  return (
    <div>
      {canShareWithPublic && (
        <>
          <div className="px-4 mt-4 mb-2">
            <Title>
              {createMessage(IN_APP_EMBED_SETTING.sectionContentHeader)}
            </Title>
          </div>
          <div className="px-4">
            <div className="flex justify-between content-center pb-4">
              <Switch
                id="t--embed-settings-application-public"
                isDisabled={isFetchingApplication || isChangingViewAccess}
                isSelected={application?.isPublic}
                onChange={() =>
                  application &&
                  dispatch(
                    changeAppViewAccessInit(
                      application?.id,
                      !application?.isPublic,
                    ),
                  )
                }
              >
                <StyledPropertyHelpLabel
                  label={createMessage(MAKE_APPLICATION_PUBLIC)}
                  lineHeight="1.17"
                  maxWidth="270px"
                  tooltip={createMessage(MAKE_APPLICATION_PUBLIC_TOOLTIP)}
                />
              </Switch>
            </div>
          </div>
          <Divider />
        </>
      )}

      <div className="px-4 mt-4 mb-2">
        <Title>{createMessage(IN_APP_EMBED_SETTING.embed)}</Title>
      </div>

      {embedSnippet.isSuperUser && (
        <div className="px-4">
          <div className="flex justify-between content-center pb-3">
            <div
              className="flex gap-1 pt-0.5 text-[color:var(--appsmith-color-black-700)]"
              data-cy={"frame-ancestors-setting"}
            >
              <Icon name={embedSnippet.embedSettingContent.icon} size="md" />
              <StyledPropertyHelpLabel
                label={embedSnippet.embedSettingContent.label}
                lineHeight="1.17"
                maxWidth="217px"
                tooltip={embedSnippet.embedSettingContent.tooltip}
              />
            </div>
            <Link
              kind="secondary"
              target="_blank"
              to="https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this"
            >
              {createMessage(IN_APP_EMBED_SETTING.change)}
            </Link>
          </div>
        </div>
      )}

      <div className="px-4 flex justify-between items-center pb-2">
        <Switch
          data-cy="show-navigation-bar-toggle"
          defaultSelected={embedSnippet.currentEmbedSetting?.showNavigationBar}
          onChange={() =>
            embedSnippet.onChange({
              showNavigationBar:
                !embedSnippet.currentEmbedSetting?.showNavigationBar,
            })
          }
        >
          {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
        </Switch>
      </div>

      <div className="px-4">
        <Text>{createMessage(IN_APP_EMBED_SETTING.embedSize)}</Text>
        <div className="flex gap-2 pt-1 pb-4">
          <DimensionsInput
            icon="w-line"
            onChange={(width: string) => embedSnippet.onChange({ width })}
            prefix="W"
            value={embedSnippet.currentEmbedSetting?.width}
          />
          <DimensionsInput
            icon="h-line"
            onChange={(height: string) => embedSnippet.onChange({ height })}
            prefix="H"
            value={embedSnippet.currentEmbedSetting.height}
          />
        </div>
      </div>

      <div className="px-4">
        <Text>{createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}</Text>
        <EmbedCodeSnippet snippet={embedSnippet.snippet} />
      </div>
    </div>
  );
}

export default EmbedSettings;
