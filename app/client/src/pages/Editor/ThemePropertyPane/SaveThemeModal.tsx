import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Category,
  DialogComponent as Dialog,
  Size,
  TextInput,
} from "design-system";
import { saveSelectedThemeAction } from "actions/appThemingActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getAppThemes } from "selectors/appThemingSelectors";
import {
  createMessage,
  ERROR_MESSAGE_NAME_EMPTY,
  APLHANUMERIC_HYPHEN_SLASH_SPACE_ERROR,
  UNIQUE_NAME_ERROR,
} from "@appsmith/constants/messages";

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
    <Dialog
      canOutsideClickClose
      isOpen={isOpen}
      onClose={onClose}
      title="Save Theme"
    >
      <div id="save-theme-modal">
        <form data-cy="save-theme-form" noValidate onSubmit={onSubmit}>
          <div className="pb-6 space-y-3">
            <p>
              You can save your custom themes to use across applications and use
              them when you need.
            </p>
            <div className="mt-6 space-y-2">
              <h3 className="text-gray-700">Your theme name</h3>
              <TextInput
                autoFocus
                errorMsg={!inputValidator.isValid ? inputValidator.message : ""}
                fill
                name="name"
                onChange={onChangeName}
                placeholder="My theme"
              />
            </div>
          </div>
          <div className="">
            <div className="flex items-center space-x-3">
              <Button
                category={Category.secondary}
                onClick={onClose}
                size={Size.medium}
                text="Cancel"
              />
              <Button
                category={Category.primary}
                disabled={!name}
                onClick={onSubmit}
                size={Size.medium}
                text="Save theme"
                type="submit"
              />
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default SaveThemeModal;
