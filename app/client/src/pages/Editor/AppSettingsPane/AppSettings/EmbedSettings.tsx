import { changeAppViewAccessInit } from "@appsmith/actions/applicationActions";
import { Switch } from "design-system-old";
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
import EmbedSnippetTab from "@appsmith/pages/Applications/EmbedSnippetTab";

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

      <EmbedSnippetTab isAppSettings />
    </div>
  );
}

export default EmbedSettings;
