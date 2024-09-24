import { changeAppViewAccessInit } from "ee/actions/applicationActions";
import { Switch, Divider } from "@appsmith/ads";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsChangingViewAccess,
} from "ee/selectors/applicationSelectors";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import styled from "styled-components";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
  MAKE_APPLICATION_PUBLIC,
} from "ee/constants/messages";
import { isPermitted, PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import MakeApplicationForkable from "./MakeApplicationForkable";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getEmbedSnippetTab } from "ee/utils/BusinessFeatures/privateEmbedHelpers";
import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";

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

function EmbedSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const isChangingViewAccess = useSelector(getIsChangingViewAccess);
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const userAppPermissions = application?.userPermissions ?? [];
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );
  const canMarkAppForkable = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );

  return (
    <div>
      {canShareWithPublic && (
        <>
          <div className="px-4 mt-4 mb-3">
            <Title>
              {createMessage(IN_APP_EMBED_SETTING.sectionContentHeader)}
            </Title>
          </div>
          <div className="px-4">
            <div className="flex justify-between content-center">
              <Switch
                data-testid="t--embed-settings-application-public"
                isDisabled={isFetchingApplication || isChangingViewAccess}
                isSelected={application?.isPublic}
                onChange={() => {
                  AnalyticsUtil.logEvent("MAKE_APPLICATION_PUBLIC", {
                    isPublic: !application?.isPublic,
                  });
                  application &&
                    dispatch(
                      changeAppViewAccessInit(
                        application?.id,
                        !application?.isPublic,
                      ),
                    );
                }}
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

      {canMarkAppForkable && (
        <MakeApplicationForkable application={application} />
      )}
      {getEmbedSnippetTab(isPrivateEmbedEnabled)}
    </div>
  );
}

export default EmbedSettings;
