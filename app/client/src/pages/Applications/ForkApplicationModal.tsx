import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import { getUserApplicationsOrgs } from "selectors/applicationSelectors";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "reducers";
import Button, { Category, Size } from "components/ads/Button";
import { StyledDialog, ButtonWrapper, SpinnerWrapper } from "./ForkModalStyles";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { useLocation } from "react-router";
import Spinner from "components/ads/Spinner";
import { IconSize } from "components/ads/Icon";
import { matchViewerForkPath } from "constants/routes";
import { Colors } from "constants/Colors";
import { Dropdown } from "components/ads";
import {
  CANCEL,
  createMessage,
  FORK,
  FORK_APP_MODAL_EMPTY_TITLE,
  FORK_APP_MODAL_LOADING_TITLE,
  FORK_APP_MODAL_SUCCESS_TITLE,
} from "@appsmith/constants/messages";
import { getAllApplications } from "actions/applicationActions";

type ForkApplicationModalProps = {
  applicationId: string;
  // if a trigger is passed
  // it renders that component
  trigger?: React.ReactNode;
  isModalOpen?: boolean;
  setModalClose?: (isOpen: boolean) => void;
};

function ForkApplicationModal(props: ForkApplicationModalProps) {
  const { isModalOpen, setModalClose } = props;
  const [organization, selectOrganization] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  const dispatch = useDispatch();
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );

  useEffect(() => {
    if (!userOrgs.length) {
      dispatch(getAllApplications());
    }
  }, [userOrgs.length]);

  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const { pathname } = useLocation();

  const showBasedOnURL = matchViewerForkPath(pathname);

  const forkApplication = () => {
    dispatch({
      type: ReduxActionTypes.FORK_APPLICATION_INIT,
      payload: {
        applicationId: props.applicationId,
        organizationId: organization?.value,
      },
    });
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
      selectOrganization({
        label: filteredUserOrgs[0].organization.name,
        value: filteredUserOrgs[0].organization.id,
      });
    }

    return filteredUserOrgs.map((org) => {
      return {
        label: org.organization.name,
        value: org.organization.id,
      };
    });
  }, [userOrgs]);

  const modalHeading = isFetchingApplications
    ? createMessage(FORK_APP_MODAL_LOADING_TITLE)
    : !organizationList.length
    ? createMessage(FORK_APP_MODAL_EMPTY_TITLE)
    : createMessage(FORK_APP_MODAL_SUCCESS_TITLE);

  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      headerIcon={{ name: "fork-2", bgColor: Colors.GEYSER_LIGHT }}
      isOpen={isModalOpen || showBasedOnURL}
      setModalClose={setModalClose}
      title={modalHeading}
      trigger={props.trigger}
    >
      {isFetchingApplications ? (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      ) : (
        !!organizationList.length && (
          <>
            <Dropdown
              boundary="viewport"
              dropdownMaxHeight={"200px"}
              fillOptions
              onSelect={(_, dropdownOption) =>
                selectOrganization(dropdownOption)
              }
              options={organizationList}
              selected={organization}
              showLabelOnly
              width={"100%"}
            />

            <ButtonWrapper>
              <Button
                category={Category.tertiary}
                disabled={forkingApplication}
                onClick={() => setModalClose && setModalClose(false)}
                size={Size.large}
                tag="button"
                text={createMessage(CANCEL)}
              />
              <Button
                className="t--fork-app-to-org-button"
                isLoading={forkingApplication}
                onClick={forkApplication}
                size={Size.large}
                tag="button"
                text={createMessage(FORK)}
              />
            </ButtonWrapper>
          </>
        )
      )}
    </StyledDialog>
  );
}

export default ForkApplicationModal;
