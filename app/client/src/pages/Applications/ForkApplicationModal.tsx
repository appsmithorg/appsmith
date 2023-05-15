import React, { useState, useMemo, useEffect } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  Spinner,
  Select,
  Option,
} from "design-system";
import { ButtonWrapper, SpinnerWrapper } from "./ForkModalStyles";
import { useLocation } from "react-router";
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

  useEffect(() => {
    if (queryParams.get("fork") === "true" || isModalOpen) {
      handleOpen();
    }
  }, []);

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
    // TODO: removed if condition here. Ensure it will affect something or not.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("fork")) {
      url.searchParams.append("fork", "true");
      history.push(url.toString().slice(url.origin.length));
    }
    dispatch(getAllApplications());
  };

  const handleOnOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      handleOpen();
    } else {
      setModalClose && setModalClose(false);
      handleClose();
    }
  };

  return (
    <Modal
      onOpenChange={handleOnOpenChange}
      open={isModalOpen || queryParams.has("fork")}
    >
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
                onSelect={(_, dropdownOption) =>
                  // ignoring this because rc-select label and value types are not compatible
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
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
                    setModalClose && setModalClose(false);
                    handleClose();
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
