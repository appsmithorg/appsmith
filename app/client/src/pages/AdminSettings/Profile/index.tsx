import React, { useEffect, useMemo, useState } from "react";
import {
  BottomSpace,
  HeaderWrapper,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "../components";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { getIsFormLoginEnabled } from "ee/selectors/organizationSelectors";
import { forgotPasswordSubmitHandler } from "pages/UserAuth/helpers";
import {
  createMessage,
  FORGOT_PASSWORD_SUCCESS_TEXT,
  USER_DISPLAY_NAME_CHAR_CHECK_FAILED,
  USER_DISPLAY_PICTURE_PLACEHOLDER,
  USER_DISPLAY_NAME_PLACEHOLDER,
  USER_EMAIL_PLACEHOLDER,
  USER_RESET_PASSWORD,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
  RESET_BUTTON,
  SAVE_BUTTON,
} from "ee/constants/messages";
import { Button, Flex, Input, Text, toast } from "@appsmith/ads";
import { logoutUser, updateUserDetails } from "actions/userActions";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { notEmptyValidator } from "@appsmith/ads-old";
import { ALL_LANGUAGE_CHARACTERS_REGEX } from "constants/Regex";
import {
  FieldWrapper,
  LabelWrapper,
  Loader,
  ResetPasswordButton,
  SettingsButtonWrapper,
  SubCategory,
} from "./StyledComponents";
import UserProfileImagePicker from "./UserProfileImagePicker";
import { emailValidator } from "@appsmith/ads-old";
import {
  getGlobalGitConfig,
  getIsFetchingGlobalGitConfig,
} from "selectors/gitSyncSelectors";
import {
  fetchGlobalGitConfigInit,
  updateGlobalGitConfigInit,
} from "actions/gitSyncActions";
import { Classes } from "@blueprintjs/core";
import { useGitModEnabled } from "pages/Editor/gitSync/hooks/modHooks";
import useGlobalProfile from "git/hooks/useGlobalProfile";

const nameValidator = (
  value: string,
): {
  isValid: boolean;
  message: string;
} => {
  const notEmpty = notEmptyValidator(value);

  if (!notEmpty.isValid) {
    return notEmpty;
  }

  if (!new RegExp(`^[${ALL_LANGUAGE_CHARACTERS_REGEX} 0-9.'-]+$`).test(value)) {
    return {
      isValid: false,
      message: createMessage(USER_DISPLAY_NAME_CHAR_CHECK_FAILED),
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

export const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);
  const isFetching = useSelector(getIsFetchingGlobalGitConfig);
  const globalGitConfig = useSelector(getGlobalGitConfig);
  const { fetchGlobalProfile, globalProfile, updateGlobalProfile } =
    useGlobalProfile();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [areFormValuesUpdated, setAreFormValuesUpdated] = useState(false);
  const isGitModEnabled = useGitModEnabled();
  const gitConfig = useMemo(
    () => (isGitModEnabled ? globalProfile : globalGitConfig),
    [isGitModEnabled, globalProfile, globalGitConfig],
  );
  const [authorName, setAuthorNameInState] = useState(gitConfig?.authorName);
  const [authorEmail, setAuthorEmailInState] = useState(gitConfig?.authorEmail);

  useEffect(() => {
    setIsSaving(false);
    setAreFormValuesUpdated(false);
    setName(user?.name || "");
    setAuthorNameInState(gitConfig?.authorName);
    setAuthorEmailInState(gitConfig?.authorEmail);
  }, [gitConfig?.authorName, gitConfig?.authorEmail, user?.name]);

  useEffect(
    function fetchGlobalGitConfigOnInitEffect() {
      if (isGitModEnabled) {
        fetchGlobalProfile();
      } else {
        dispatch(fetchGlobalGitConfigInit());
      }
    },
    [dispatch, isGitModEnabled],
  );

  useEffect(() => {
    if (
      user?.name !== name ||
      gitConfig?.authorName !== authorName ||
      gitConfig?.authorEmail !== authorEmail
    ) {
      setAreFormValuesUpdated(true);
    } else {
      setAreFormValuesUpdated(false);
    }
  }, [name, authorName, authorEmail]);

  const updateConfig = () => {
    if (authorName && authorEmail && emailValidator(authorEmail).isValid) {
      if (isGitModEnabled) {
        updateGlobalProfile({ authorName, authorEmail });
      } else {
        dispatch(updateGlobalGitConfigInit({ authorName, authorEmail }));
      }
    } else {
      toast.show("Please enter valid git author details", {
        kind: "error",
      });
      setAuthorNameInState(gitConfig?.authorName);
      setAuthorEmailInState(gitConfig?.authorEmail);
      setIsSaving(false);
    }
  };

  const forgotPassword = async () => {
    try {
      await forgotPasswordSubmitHandler({ email: user?.email }, dispatch);
      toast.show(createMessage(FORGOT_PASSWORD_SUCCESS_TEXT, user?.email), {
        kind: "success",
      });
      dispatch(logoutUser());
    } catch (error) {
      toast.show((error as { _error: string })._error, {
        kind: "error",
      });
    }
  };

  const saveName = () => {
    const validation = nameValidator(name);

    if (!validation.isValid) {
      toast.show(validation.message, { kind: "error" });
      setIsSaving(false);
      setName(user?.name || "");

      return;
    }

    dispatch(
      updateUserDetails({
        name,
      }),
    );
  };

  const onSave = () => {
    if (user?.name !== name) {
      setIsSaving(true);
      saveName();
    }

    if (
      gitConfig?.authorName !== authorName ||
      gitConfig?.authorEmail !== authorEmail
    ) {
      setIsSaving(true);
      updateConfig();
    }
  };

  const onClear = () => {
    setName(user?.name || "");
    setAuthorNameInState(gitConfig?.authorName);
    setAuthorEmailInState(gitConfig?.authorEmail);
    setAreFormValuesUpdated(false);
  };

  if (user?.email === ANONYMOUS_USERNAME) return null;

  return (
    <Wrapper>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            Account
          </SettingsHeader>
          <SettingsSubHeader
            color="var(--ads-v2-color-fg-emphasis)"
            kind="body-m"
            renderAs="h2"
          >
            Set your profile and git settings
          </SettingsSubHeader>
        </HeaderWrapper>
        <SubCategory kind="heading-s" renderAs="p">
          Profile
        </SubCategory>
        <Flex flexDirection="column" gap="spaces-5">
          <FieldWrapper>
            <LabelWrapper>
              <Text kind="body-m">
                {createMessage(USER_DISPLAY_PICTURE_PLACEHOLDER)}
              </Text>
            </LabelWrapper>
            <div className="user-profile-image-picker">
              <UserProfileImagePicker />
            </div>
          </FieldWrapper>
          <FieldWrapper>
            <Input
              data-testid="t--display-name"
              isRequired
              label={createMessage(USER_DISPLAY_NAME_PLACEHOLDER)}
              labelPosition="top"
              onChange={setName}
              placeholder={createMessage(USER_DISPLAY_NAME_PLACEHOLDER)}
              renderAs="input"
              size="md"
              type="text"
              value={name}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Flex flexDirection="column" gap="spaces-2">
              <Input
                data-testid="t--user-name"
                defaultValue={user?.email}
                isDisabled
                isReadOnly
                label={createMessage(USER_EMAIL_PLACEHOLDER)}
                labelPosition="top"
                placeholder={createMessage(USER_EMAIL_PLACEHOLDER)}
                renderAs="input"
                size="md"
                type="text"
              />
              {isFormLoginEnabled && (
                <ResetPasswordButton
                  className="t--user-reset-password"
                  kind="tertiary"
                  onClick={forgotPassword}
                  renderAs="a"
                  size="md"
                  startIcon="restart-line"
                >
                  {createMessage(USER_RESET_PASSWORD)}
                </ResetPasswordButton>
              )}
            </Flex>
          </FieldWrapper>
        </Flex>
        <SubCategory kind="heading-s" renderAs="p">
          Git author
        </SubCategory>
        <Flex flexDirection="column" gap="spaces-5">
          <FieldWrapper>
            {isFetching && <Loader className={Classes.SKELETON} />}
            {!isFetching && (
              <Input
                data-testid="t--git-author-name"
                isRequired
                label={createMessage(AUTHOR_NAME)}
                labelPosition="top"
                onChange={setAuthorNameInState}
                placeholder={createMessage(AUTHOR_NAME)}
                renderAs="input"
                size="md"
                type="text"
                value={authorName}
              />
            )}
          </FieldWrapper>
          <FieldWrapper>
            {isFetching && <Loader className={Classes.SKELETON} />}
            {!isFetching && (
              <Input
                data-testid="t--git-author-email"
                isRequired
                label={createMessage(AUTHOR_EMAIL)}
                labelPosition="top"
                onChange={setAuthorEmailInState}
                placeholder={createMessage(AUTHOR_EMAIL)}
                renderAs="input"
                size="md"
                type="text"
                value={authorEmail}
              />
            )}
          </FieldWrapper>
        </Flex>
        <SettingsButtonWrapper>
          <Button
            className="t--admin-settings-save-button"
            isDisabled={!areFormValuesUpdated}
            isLoading={isSaving}
            onClick={onSave}
            size="md"
          >
            {createMessage(SAVE_BUTTON)}
          </Button>
          <Button
            className="t--admin-settings-reset-button"
            isDisabled={!areFormValuesUpdated}
            kind="secondary"
            onClick={onClear}
            size="md"
          >
            {createMessage(RESET_BUTTON)}
          </Button>
        </SettingsButtonWrapper>
        <BottomSpace />
      </SettingsFormWrapper>
    </Wrapper>
  );
};
