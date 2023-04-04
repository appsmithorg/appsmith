import { changeAppViewAccessInit } from "@appsmith/actions/applicationActions";
import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  Classes,
  Icon,
} from "design-system-old";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsChangingViewAccess,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import SwitchWrapper from "../Components/SwitchWrapper";
import styled from "styled-components";
import { Colors } from "constants/Colors";
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

const StyledLink = styled.a`
  position: relative;
  top: 1px;
  :hover {
    text-decoration: none;
  }

  .${Classes.TEXT} {
    border-bottom: 1px solid ${Colors.GRAY_700};
  }
`;

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
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
          <div className="px-4">
            <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
              {createMessage(IN_APP_EMBED_SETTING.sectionContentHeader)}
            </div>
          </div>
          <div className="px-4">
            <div className="flex justify-between content-center pb-4">
              <StyledPropertyHelpLabel
                label={createMessage(MAKE_APPLICATION_PUBLIC)}
                lineHeight="1.17"
                maxWidth="270px"
                tooltip={createMessage(MAKE_APPLICATION_PUBLIC_TOOLTIP)}
              />
              <SwitchWrapper>
                <Switch
                  checked={application?.isPublic}
                  className="mb-0"
                  disabled={isFetchingApplication || isChangingViewAccess}
                  id="t--embed-settings-application-public"
                  large
                  onChange={() =>
                    application &&
                    dispatch(
                      changeAppViewAccessInit(
                        application?.id,
                        !application?.isPublic,
                      ),
                    )
                  }
                />
              </SwitchWrapper>
            </div>
          </div>
          <div
            className={`border-t-[1px] border-[color:var(--appsmith-color-black-300)]`}
          />
        </>
      )}

      <div className="px-4">
        <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
          {createMessage(IN_APP_EMBED_SETTING.embed)}
        </div>
      </div>

      {embedSnippet.isSuperUser && (
        <div className="px-4">
          <div className="flex justify-between content-center pb-3">
            <div
              className="flex gap-1 pt-0.5 text-[color:var(--appsmith-color-black-700)]"
              data-cy={"frame-ancestors-setting"}
            >
              <Icon
                name={embedSnippet.embedSettingContent.icon}
                size={IconSize.XXL}
              />
              <StyledPropertyHelpLabel
                label={embedSnippet.embedSettingContent.label}
                lineHeight="1.17"
                maxWidth="217px"
                tooltip={embedSnippet.embedSettingContent.tooltip}
              />
            </div>
            <StyledLink
              href="https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this"
              target="_blank"
            >
              <Text
                case={Case.UPPERCASE}
                color={Colors.GRAY_700}
                type={TextType.BUTTON_SMALL}
              >
                {createMessage(IN_APP_EMBED_SETTING.change)}
              </Text>
            </StyledLink>
          </div>
        </div>
      )}

      <div className="px-4 flex justify-between items-center pb-2">
        <Text type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
        </Text>
        <SwitchWrapper>
          <Switch
            className="mb-0"
            data-cy="show-navigation-bar-toggle"
            defaultChecked={embedSnippet.currentEmbedSetting?.showNavigationBar}
            large
            onChange={() =>
              embedSnippet.onChange({
                showNavigationBar:
                  !embedSnippet.currentEmbedSetting?.showNavigationBar,
              })
            }
          />
        </SwitchWrapper>
      </div>

      <div className="px-4">
        <Text type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.embedSize)}
        </Text>
        <div className="flex gap-2 pt-1 pb-4">
          <DimensionsInput
            onChange={(width: string) => embedSnippet.onChange({ width })}
            prefix="W"
            value={embedSnippet.currentEmbedSetting?.width}
          />
          <DimensionsInput
            onChange={(height: string) => embedSnippet.onChange({ height })}
            prefix="H"
            value={embedSnippet.currentEmbedSetting.height}
          />
        </div>
      </div>

      <div className="px-4">
        <Text type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}
        </Text>
        <EmbedCodeSnippet snippet={embedSnippet.snippet} />
      </div>
    </div>
  );
}

export default EmbedSettings;
