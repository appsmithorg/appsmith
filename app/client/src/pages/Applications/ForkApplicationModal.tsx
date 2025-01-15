import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hasCreateNewAppPermission } from "ee/utils/permissionHelpers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { AppState } from "ee/reducers";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  Spinner,
  Select,
  Option,
} from "@appsmith/ads";
import { ButtonWrapper, SpinnerWrapper } from "./ForkModalStyles";
import {
  CANCEL,
  createMessage,
  FORK,
  FORK_APP_MODAL_EMPTY_TITLE,
  FORK_APP_MODAL_LOADING_TITLE,
  FORK_APP_MODAL_SUCCESS_TITLE,
} from "ee/constants/messages";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";
import { fetchAllWorkspaces } from "ee/actions/workspaceActions";

interface ForkApplicationModalProps {
  applicationId: string;
  // if a trigger is passed
  // it renders that component
  trigger?: React.ReactNode;
  isModalOpen?: boolean;
  handleOpen?: () => void;
  handleClose?: () => void;
  isInEditMode?: boolean;
}

function ForkApplicationModal(props: ForkApplicationModalProps) {
  const { handleClose, handleOpen, isModalOpen } = props;
  const [workspace, selectWorkspace] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  const dispatch = useDispatch();
  const workspaces = useSelector(getFetchedWorkspaces);
  const forkingApplication = useSelector(
    (state: AppState) => state.ui.applications.forkingApplication,
  );

  const isFetchingApplications = useSelector(getIsFetchingApplications);

  useEffect(() => {
    // This effect makes sure that no if <ForkApplicationModel />
    // is getting controlled from outside, then we always load workspaces
    if (isModalOpen) {
      getApplicationsListAndOpenModal();

      return;
    }
  }, [isModalOpen]);

  useEffect(() => {
    // when we fork from within the appeditor, fork modal remains open
    // even on the landing page of "Forked" app, this closes it
    const url = new URL(window.location.href);
    const shouldCloseForcibly =
      !forkingApplication &&
      isModalOpen &&
      handleClose &&
      !url.searchParams.has("fork");

    if (shouldCloseForcibly) {
      handleClose();
    }
  }, [forkingApplication]);

  const forkApplication = () => {
    dispatch({
      type: ReduxActionTypes.FORK_APPLICATION_INIT,
      payload: {
        applicationId: props.applicationId,
        workspaceId: workspace?.value,
        editMode: props.isInEditMode,
      },
    });
  };

  const workspaceList = useMemo(() => {
    const filteredUserWorkspaces = workspaces.filter((item) => {
      const permitted = hasCreateNewAppPermission(item.userPermissions ?? []);

      return permitted;
    });

    if (filteredUserWorkspaces.length) {
      selectWorkspace({
        label: filteredUserWorkspaces[0].name,
        value: filteredUserWorkspaces[0].id,
      });
    }

    return filteredUserWorkspaces.map((workspace) => {
      return {
        label: workspace.name,
        value: workspace.id,
      };
    });
  }, [workspaces]);

  const modalHeading = isFetchingApplications
    ? createMessage(FORK_APP_MODAL_LOADING_TITLE)
    : !workspaceList.length
      ? createMessage(FORK_APP_MODAL_EMPTY_TITLE)
      : createMessage(FORK_APP_MODAL_SUCCESS_TITLE);

  const getApplicationsListAndOpenModal = () => {
    !workspaceList.length &&
      dispatch(fetchAllWorkspaces({ fetchEntities: true }));
    handleOpen && handleOpen();
  };

  const handleOnOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      getApplicationsListAndOpenModal();
    } else {
      handleClose && handleClose();
    }
  };

  return (
    <Modal onOpenChange={handleOnOpenChange} open={isModalOpen}>
      <ModalContent className={"fork-modal"} style={{ width: "640px" }}>
        <ModalHeader>{modalHeading}</ModalHeader>
        {isFetchingApplications ? (
          <SpinnerWrapper>
            <Spinner size="lg" />
          </SpinnerWrapper>
        ) : (
          !!workspaceList.length && (
            <>
              <Select
                dropdownMatchSelectWidth
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onSelect={(_, dropdownOption) =>
                  // ignoring this because rc-select label and value types are not compatible
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  selectWorkspace(dropdownOption)
                }
                value={workspace.value}
              >
                {workspaceList.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>

              <ButtonWrapper>
                <Button
                  isDisabled={forkingApplication}
                  kind="secondary"
                  onClick={() => {
                    handleClose && handleClose();
                  }}
                  size="md"
                >
                  {createMessage(CANCEL)}
                </Button>
                <Button
                  className="t--fork-app-to-workspace-button"
                  isLoading={forkingApplication}
                  onClick={forkApplication}
                  size="md"
                >
                  {createMessage(FORK)}
                </Button>
              </ButtonWrapper>
            </>
          )
        )}
      </ModalContent>
    </Modal>
  );
}

export default ForkApplicationModal;
