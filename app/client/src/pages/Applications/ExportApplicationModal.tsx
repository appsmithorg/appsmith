import React, { useState, useMemo } from "react";
import { useSelector } from "store";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import { AppState } from "reducers";
import { Size } from "components/ads/Button";
import {
  StyledDialog,
  StyledRadioComponent,
  ForkButton,
  OrganizationList,
  ButtonWrapper,
  SpinnerWrapper,
} from "./ForkModalStyles";
import Divider from "components/editorComponents/Divider";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { useLocation } from "react-router";
import { getApplicationViewerPageURL } from "constants/routes";
import { getCurrentPageId } from "selectors/editorSelectors";
import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";

type ExportApplicationModalProps = {
  export: (applicationId: string) => void;
  applicationId: string;
  isModalOpen?: boolean;
  setModalClose?: (isOpen: boolean) => void;
};

function ExportApplicationModal(props: ExportApplicationModalProps) {
  const { setModalClose, isModalOpen } = props;
  const [organizationId, selectOrganizationId] = useState("");
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );

  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const currentPageId = useSelector(getCurrentPageId);
  const { pathname } = useLocation();
  const showBasedOnURL =
    pathname ===
    `${getApplicationViewerPageURL(props.applicationId, currentPageId)}/fork`;

  const exportApplication = () => {
    props.export(props.applicationId);
  };

  const organizationList = useMemo(() => {
    const filteredUserOrgs = userOrgs.filter((item) => {
      const permitted = isPermitted(
        item.organization.userPermissions ?? [],
        PERMISSION_TYPE.CREATE_APPLICATION,
      );
      return permitted;
    });

    if (filteredUserOrgs.length) {
      selectOrganizationId(filteredUserOrgs[0].organization.id);
    }

    return filteredUserOrgs.map((org) => {
      return {
        label: org.organization.name,
        value: org.organization.id,
      };
    });
  }, [userOrgs]);

  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      isOpen={isModalOpen || showBasedOnURL}
      maxHeight={"540px"}
      setModalClose={setModalClose}
      title={"Be sure to read the data policy"}
    >
      <Divider />
      {isFetchingApplications && (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      )}
      {!isFetchingApplications && organizationList.length && (
        <OrganizationList>
          <StyledRadioComponent
            className={"radio-group"}
            columns={1}
            defaultValue={organizationList[0].value}
            onSelect={(value) => selectOrganizationId(value)}
            options={organizationList}
          />
        </OrganizationList>
      )}
      <ButtonWrapper>
        <ForkButton
          cypressSelector={"t--fork-app-to-org-button"}
          disabled={!organizationId}
          isLoading={forkingApplication}
          onClick={exportApplication}
          size={Size.large}
          text={"FORK"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ExportApplicationModal;
