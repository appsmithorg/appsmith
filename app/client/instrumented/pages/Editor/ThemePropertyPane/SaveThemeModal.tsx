import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AnalyticsUtil from "utils/AnalyticsUtil";
import { saveSelectedThemeAction } from "actions/appThemingActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getAppThemes } from "selectors/appThemingSelectors";
import {
  createMessage,
  ERROR_MESSAGE_NAME_EMPTY,
  APLHANUMERIC_HYPHEN_SLASH_SPACE_ERROR,
  UNIQUE_NAME_ERROR,
} from "@appsmith/constants/messages";
import {
  Button,
  Input,
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from "design-system";

interface SaveThemeModalProps {
  isOpen: boolean;
  onClose(): void;
}

function SaveThemeModal(props: SaveThemeModalProps) {
  const { isOpen } = props;
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [inputValidator, setInputValidator] = useState({
    isValid: false,
    message: "",
    isDirty: false,
  });
  const applicationId = useSelector(getCurrentApplicationId);
  const themes = useSelector(getAppThemes);

  /**
   * dispatches action to save selected theme
   *
   */
  const onSubmit = (event: any) => {
    event.preventDefault();

    // if input validations fails, don't do anything
    if (!inputValidator.isValid || inputValidator.isDirty === false) return;

    AnalyticsUtil.logEvent("APP_THEMING_SAVE_THEME_SUCCESS", {
      themeName: name,
    });

    dispatch(saveSelectedThemeAction({ applicationId, name }));

    // close the modal after submit
    onClose();
  };

  /**
   * theme creation validator
   *
   * @param value
   * @returns
   */
  const createThemeValidator = (value: string) => {
    let isValid = !!value;

    let errorMessage = !isValid ? createMessage(ERROR_MESSAGE_NAME_EMPTY) : "";

    if (
      isValid &&
      themes.find((theme) => value.toLowerCase() === theme.name.toLowerCase())
    ) {
      isValid = false;
      errorMessage = createMessage(UNIQUE_NAME_ERROR);
    }

    if (/[^a-zA-Z0-9\-\/\ ]/.test(value)) {
      isValid = false;
      errorMessage = createMessage(APLHANUMERIC_HYPHEN_SLASH_SPACE_ERROR);
    }

    return {
      isValid: isValid,
      message: errorMessage,
      isDirty: true,
    };
  };

  /**
   * on input change
   *
   * @param value
   */
  const onChangeName = (value: string) => {
    const validator = createThemeValidator(value);

    setInputValidator(validator);
    setName(value);
  };

  /**
   * on close modal
   */
  const onClose = () => {
    // reset validations
    setInputValidator({
      isValid: false,
      message: "",
      isDirty: false,
    });

    props.onClose();
  };

  return (
    <Modal
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <ModalContent
        id="save-theme-modal"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        style={{ width: "640px" }}
      >
        <ModalHeader>Save theme</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Text kind="action-l">
              You can save your custom themes to use across applications and use
              them when you need.
            </Text>
            <form data-testid="save-theme-form" noValidate onSubmit={onSubmit}>
              <Input
                autoFocus
                errorMessage={
                  !inputValidator.isValid ? inputValidator.message : undefined
                }
                isRequired
                label="Your theme name"
                name="name"
                onChange={onChangeName}
                placeholder="My theme"
                size="md"
              />
            </form>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3">
            <Button kind="secondary" onClick={onClose} size="md">
              Cancel
            </Button>
            <Button
              isDisabled={!name}
              onClick={onSubmit}
              size="md"
              type="submit"
            >
              Save theme
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SaveThemeModal;
