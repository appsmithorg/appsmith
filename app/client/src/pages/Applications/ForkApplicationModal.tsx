import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserApplicationsWorkspaces,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import {
  Button,
  Category,
  Dropdown,
  IconSize,
  Size,
  Spinner,
} from "design-system-old";
import { StyledDialog, ButtonWrapper, SpinnerWrapper } from "./ForkModalStyles";
import { useLocation } from "react-router";
import { Colors } from "constants/Colors";
import {
  CANCEL,
  createMessage,
  FORK,
  FORK_APP_MODAL_EMPTY_TITLE,
  FORK_APP_MODAL_LOADING_TITLE,
  FORK_APP_MODAL_SUCCESS_TITLE,
} from "@appsmith/constants/messages";
import { getAllApplications } from "@appsmith/actions/applicationActions";
import history from "utils/history";

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
  const [workspace, selectWorkspace] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  const dispatch = useDispatch();
  const userWorkspaces = useSelector(getUserApplicationsWorkspaces);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );

  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const forkApplication = () => {
    dispatch({
      type: ReduxActionTypes.FORK_APPLICATION_INIT,
      payload: {
        applicationId: props.applicationId,
        workspaceId: workspace?.value,
      },
    });
  };

  const workspaceList = useMemo(() => {
    const filteredUserWorkspaces = userWorkspaces.filter((item) => {
      const permitted = hasCreateNewAppPermission(
        item.workspace.userPermissions ?? [],
      );
      return permitted;
    });

    if (filteredUserWorkspaces.length) {
      selectWorkspace({
        label: filteredUserWorkspaces[0].workspace.name,
        value: filteredUserWorkspaces[0].workspace.id,
      });
    }

    return filteredUserWorkspaces.map((workspace) => {
      return {
        label: workspace.workspace.name,
        value: workspace.workspace.id,
      };
    });
  }, [userWorkspaces]);

  const modalHeading = isFetchingApplications
    ? createMessage(FORK_APP_MODAL_LOADING_TITLE)
    : !workspaceList.length
    ? createMessage(FORK_APP_MODAL_EMPTY_TITLE)
    : createMessage(FORK_APP_MODAL_SUCCESS_TITLE);

  const handleClose = () => {
    if (!props.setModalClose) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("fork")) {
        url.searchParams.delete("fork");
        history.push(url.toString().slice(url.origin.length));
      }
    }
  };

  const handleOpen = () => {
    if (!props.setModalClose) {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("fork")) {
        url.searchParams.append("fork", "true");
        history.push(url.toString().slice(url.origin.length));
      }
      dispatch(getAllApplications());
    }
  };

  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      headerIcon={{ name: "fork-2", bgColor: Colors.GEYSER_LIGHT }}
      isOpen={isModalOpen || queryParams.has("fork")}
      onClose={handleClose}
      onOpening={handleOpen}
      setModalClose={setModalClose}
      title={modalHeading}
      trigger={props.trigger}
    >
      {isFetchingApplications ? (
        <SpinnerWrapper>
          <Spinner size={IconSize.XXXL} />
        </SpinnerWrapper>
      ) : (
        !!workspaceList.length && (
          <>
            <Dropdown
              boundary="viewport"
              dropdownMaxHeight={"200px"}
              fillOptions
              onSelect={(
                _: string,
                dropdownOption: React.SetStateAction<{
                  label: string;
                  value: string;
                }>,
              ) => selectWorkspace(dropdownOption)}
              options={workspaceList}
              selected={workspace}
              showLabelOnly
              width={"100%"}
            />

            <ButtonWrapper>
              <Button
                category={Category.secondary}
                disabled={forkingApplication}
                onClick={() => {
                  setModalClose && setModalClose(false);
                  handleClose();
                }}
                size={Size.large}
                tag="button"
                text={createMessage(CANCEL)}
              />
              <Button
                className="t--fork-app-to-workspace-button"
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
