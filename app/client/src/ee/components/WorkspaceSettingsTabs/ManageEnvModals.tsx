import {
  createNewEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from "@appsmith/actions/environmentAction";
import {
  ARE_YOU_SURE,
  CANCEL,
  CREATE,
  createMessage,
  DELETE,
  MANAGE_ENV_CREATE_MODAL_TITLE,
  MANAGE_ENV_EDIT_MODAL_TITLE,
  MANAGE_ENV_ERROR_DUPLICATE_NAME_MESSAGE,
  MANAGE_ENV_ERROR_SP_CHAR_MESSAGE,
  MANAGE_ENV_ERROR_START_WITH_SP_CHAR_NUM_MESSAGE,
  MANAGE_ENV_MODAL_DELETE_DESC,
  MANAGE_ENV_MODAL_INPUT_LABEL,
  MANAGE_ENV_MODAL_INPUT_PLACEHOLDER,
  UPDATE,
} from "@appsmith/constants/messages";
import type { EnvironmentType } from "@appsmith/configs/types";
import { isEnvironmentUpdating } from "@appsmith/selectors/environmentSelectors";
import {
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  ModalFooter,
  Button,
  Icon,
} from "design-system";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { capitalizeFirstLetter } from "utils/helpers";

const InputErrorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
`;

const verifyUniqueEnvName = (
  envName: string,
  envList: EnvironmentType[],
): boolean => {
  return envList.every(
    (env) => env.name.toLowerCase() !== envName.toLowerCase(),
  );
};

interface ManageEnvModalProps {
  isOpen: boolean;
  onClose: () => void;
  env: EnvironmentType;
  envList: EnvironmentType[];
  workspaceId: string;
}

export const ManageEnvModal = ({
  env,
  envList,
  isOpen,
  onClose,
  workspaceId,
}: ManageEnvModalProps) => {
  const isCreateMode = env.name === "Default";
  const [envNameInput, setEnvNameInput] = useState(env.name);
  const [error, setError] = useState("");
  const [updateStarted, setUpdateStarted] = useState(false);
  const dispatch = useDispatch();
  const isUpdating = useSelector(isEnvironmentUpdating);

  useEffect(() => {
    setEnvNameInput(isCreateMode ? "" : env.name);
    setError("");
    setUpdateStarted(false);
  }, [env.name, isOpen]);

  useEffect(() => {
    if (updateStarted && !isUpdating && isOpen) {
      onClose();
      setError("");
      setUpdateStarted(false);
    }
  }, [isUpdating, onClose, updateStarted]);

  const renderInputErrorNode = () => {
    if (error.length === 0) return null;
    return (
      <InputErrorWrapper>
        <Icon name="alert-line" size="sm" />
        {error}
      </InputErrorWrapper>
    );
  };

  const allowSubmit = () => {
    // disable submit button if env name is empty,
    // or if env name is same as existing env name
    // or if env name has special characters
    // or if env name starts with number or underscore
    // or the length of env name is greater than 63
    // or error is not empty

    if (envNameInput.length === 0) return false;

    if (envNameInput.length > 63) return false;

    if (envNameInput === env.name) return false;

    if (error.length > 0) return false;

    return true;
  };

  const handleSubmit = () => {
    if (isUpdating) return;
    if (!verifyUniqueEnvName(envNameInput, envList)) {
      setError(createMessage(MANAGE_ENV_ERROR_DUPLICATE_NAME_MESSAGE));
      return;
    }
    if (isCreateMode) {
      dispatch(createNewEnvironment(envNameInput, workspaceId));
    } else {
      dispatch(updateEnvironment(envNameInput, env.id));
    }
    setUpdateStarted(true);
  };

  return (
    <Modal onOpenChange={onClose} open={isOpen}>
      <ModalContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Don't close Modal when pressed outside
        onInteractOutside={(e) => e.preventDefault()}
        style={{ width: "640px" }}
      >
        <ModalHeader>
          {createMessage(
            isCreateMode
              ? MANAGE_ENV_CREATE_MODAL_TITLE
              : MANAGE_ENV_EDIT_MODAL_TITLE,
          )}
        </ModalHeader>
        <ModalBody>
          <Input
            autoFocus
            errorMessage={renderInputErrorNode()}
            isValid={error === ""}
            label={createMessage(MANAGE_ENV_MODAL_INPUT_LABEL)}
            onChange={(value) => {
              let error = "";
              // replace space with underscore and limit character length to 30
              value = value.replace(/ /g, "_").substring(0, 30);
              // check if env name has special characters (except underscore)
              if (!/^[a-zA-Z0-9_]*$/.test(value)) {
                error = createMessage(MANAGE_ENV_ERROR_SP_CHAR_MESSAGE);
              }
              // check if env name starts with number or underscore
              if (/^[0-9_]/.test(value)) {
                error = createMessage(
                  MANAGE_ENV_ERROR_START_WITH_SP_CHAR_NUM_MESSAGE,
                );
              }

              if (!verifyUniqueEnvName(value, envList))
                error = createMessage(MANAGE_ENV_ERROR_DUPLICATE_NAME_MESSAGE);

              setEnvNameInput(capitalizeFirstLetter(value));
              setError(error);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && allowSubmit()) handleSubmit();
              else if (e.key === "Escape") onClose();
            }}
            placeholder={createMessage(MANAGE_ENV_MODAL_INPUT_PLACEHOLDER)}
            renderAs="input"
            size="md"
            value={envNameInput}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--cancel-env"
            isDisabled={isUpdating}
            kind="secondary"
            onClick={() => {
              onClose();
            }}
            size="md"
          >
            {createMessage(CANCEL)}
          </Button>
          <Button
            className="t--submit-env"
            isDisabled={!allowSubmit()}
            isLoading={isUpdating}
            kind="primary"
            onClick={() => {
              handleSubmit();
            }}
            size="md"
          >
            {createMessage(isCreateMode ? CREATE : UPDATE)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const DeleteEnvModal = ({
  env,
  isOpen,
  onClose,
  workspaceName,
}: {
  isOpen: boolean;
  onClose: () => void;
  env: EnvironmentType;
  workspaceName: string;
}) => {
  const dispatch = useDispatch();
  const isUpdating: boolean = useSelector(isEnvironmentUpdating);
  const [updateStarted, setUpdateStarted] = useState(false);

  const handleSubmit = () => {
    if (isUpdating) return;
    dispatch(deleteEnvironment(env.id));
    setUpdateStarted(true);
  };

  useEffect(() => {
    if (updateStarted && !isUpdating && isOpen) {
      onClose();
      setUpdateStarted(false);
    }
  }, [isUpdating, onClose, updateStarted]);

  return (
    <Modal onOpenChange={onClose} open={isOpen}>
      <ModalContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Don't close Modal when pressed outside
        onInteractOutside={(e) => e.preventDefault()}
        style={{ width: "640px" }}
      >
        <ModalHeader>{createMessage(ARE_YOU_SURE)}</ModalHeader>
        <ModalBody>
          <Text>
            {createMessage(() =>
              MANAGE_ENV_MODAL_DELETE_DESC(
                env.name,
                workspaceName,
                env?.datasourceMeta?.configuredDatasources || 0,
              ),
            )}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--cancel-env"
            isDisabled={isUpdating}
            kind="secondary"
            onClick={() => {
              onClose();
            }}
            size="md"
          >
            {createMessage(CANCEL)}
          </Button>
          <Button
            className="t--submit-env"
            isLoading={isUpdating}
            kind="primary"
            onClick={() => {
              handleSubmit();
            }}
            size="md"
          >
            {createMessage(DELETE)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
