import React, { useEffect, useMemo } from "react";
import { Space } from "../../components/StyledComponents";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  GIT_USER_SETTINGS_TITLE,
  USE_DEFAULT_CONFIGURATION,
  createMessage,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { Button, Input, Switch, Text } from "design-system";
import {
  getGlobalGitConfig,
  getLocalGitConfig,
  getIsFetchingGlobalGitConfig,
  getIsFetchingLocalGitConfig,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { omit } from "lodash";
import {
  fetchGlobalGitConfigInit,
  fetchLocalGitConfigInit,
  updateLocalGitConfigInit,
} from "actions/gitSyncActions";

const Container = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
`;

const HeadContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeadTitle = styled(Text)``;

const HeadAction = styled.div``;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
`;

export type AuthorInfo = {
  authorName: string;
  authorEmail: string;
  useGlobalProfile: boolean;
};

const GitUserSettings = () => {
  const dispatch = useDispatch();
  const isFetchingGlobalGitConfig = useSelector(getIsFetchingGlobalGitConfig);
  const isFetchingLocalGitConfig = useSelector(getIsFetchingLocalGitConfig);
  const globalConfig = useSelector(getGlobalGitConfig);
  const localConfig = useSelector(getLocalGitConfig);

  const { control, handleSubmit, register, setValue, watch } =
    useForm<AuthorInfo>();

  const useGlobalProfile = watch("useGlobalProfile");
  const authorName = watch("authorName");
  const authorEmail = watch("authorEmail");

  useEffect(() => {
    dispatch(fetchGlobalGitConfigInit());
    dispatch(fetchLocalGitConfigInit());
  }, []);

  useEffect(() => {
    if (!isFetchingGlobalGitConfig && !isFetchingLocalGitConfig) {
      setValue("useGlobalProfile", !!localConfig?.useGlobalProfile);
    }
  }, [isFetchingGlobalGitConfig, isFetchingLocalGitConfig]);

  useEffect(() => {
    if (!isFetchingGlobalGitConfig && !isFetchingLocalGitConfig) {
      if (!useGlobalProfile) {
        setValue("authorName", localConfig?.authorName);
        setValue("authorEmail", localConfig?.authorEmail);
      } else {
        setValue("authorName", globalConfig?.authorName);
        setValue("authorEmail", globalConfig?.authorEmail);
      }
    }
  }, [isFetchingGlobalGitConfig, isFetchingLocalGitConfig, useGlobalProfile]);

  const onSubmit: SubmitHandler<AuthorInfo> = (data) => {
    if (!data.useGlobalProfile) {
      data.authorName = localConfig?.authorName;
      data.authorEmail = localConfig?.authorEmail;
    }
    dispatch(updateLocalGitConfigInit(data));
  };

  const isSubmitAllowed = useMemo(() => {
    if (!isFetchingGlobalGitConfig && !isFetchingLocalGitConfig) {
      if (useGlobalProfile) {
        return (
          authorName !== globalConfig?.authorName ||
          authorEmail !== globalConfig?.authorEmail ||
          useGlobalProfile !== localConfig?.useGlobalProfile
        );
      } else {
        return (
          authorName !== localConfig?.authorName ||
          authorEmail !== localConfig?.authorEmail ||
          useGlobalProfile !== localConfig?.useGlobalProfile
        );
      }
    } else {
      return false;
    }
  }, [
    isFetchingGlobalGitConfig,
    isFetchingLocalGitConfig,
    localConfig,
    globalConfig,
    useGlobalProfile,
    authorName,
    authorEmail,
  ]);

  if (isFetchingGlobalGitConfig || isFetchingLocalGitConfig) {
    return <>Loading...</>;
  }

  return (
    <Container>
      <form onSubmit={handleSubmit(onSubmit)}>
        <HeadContainer>
          <HeadTitle kind="heading-s">
            {createMessage(GIT_USER_SETTINGS_TITLE)}
          </HeadTitle>
          <HeadAction>
            <Controller
              control={control}
              name="useGlobalProfile"
              render={({ field }) => {
                return (
                  <Switch
                    data-testid="t--git-user-settings-switch"
                    // isSelected={useGlobalConfig}
                    //   onChange={toggleUseDefaultConfig}
                    {...omit(field, ["value"])}
                    isSelected={field.value}
                    //   onChange={(v) => setValue("useGlobalConfig", v)}
                  >
                    {createMessage(USE_DEFAULT_CONFIGURATION)}
                  </Switch>
                );
              }}
            />
          </HeadAction>
        </HeadContainer>

        <Space size={5} />
        <InputContainer>
          <Input
            data-testid="t--git-user-settings-author-name-input"
            // errorMessage={
            //   nameInvalid ? createMessage(AUTHOR_NAME_CANNOT_BE_EMPTY) : ""
            // }
            isReadOnly={useGlobalProfile}
            // isValid={!nameInvalid}
            label={createMessage(AUTHOR_NAME)}
            // isLoading={isFetchingConfig}
            // onBlur={() => setNameInputFocused(false)}
            // onChange={(value: string) =>
            //   changeHandler(AUTHOR_INFO_LABEL.NAME, value)
            // }
            // onFocus={() => setNameInputFocused(true)}
            size="md"
            type="text"
            // value={authorInfo.authorName}
            {...register("authorName", { required: true })}
            // onChange is overwritten with setValue
            onChange={(v) => setValue("authorName", v)}
          />
        </InputContainer>
        <InputContainer>
          <Input
            data-testid="t--git-user-settings-author-email-input"
            // errorMessage={
            //   emailInvalid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : ""
            // }
            isReadOnly={useGlobalProfile}
            // isValid={!emailInvalid}
            label={createMessage(AUTHOR_EMAIL)}
            // isLoading={isFetchingConfig}
            // onBlur={() => setEmailInputFocused(false)}
            // onChange={(value: string) =>
            //   changeHandler(AUTHOR_INFO_LABEL.EMAIL, value)
            // }
            // onFocus={() => setEmailInputFocused(true)}
            size="md"
            type="email"
            // value={authorInfo.authorEmail}
            {...register("authorEmail", { required: true })}
            // onChange is overwritten with setValue
            onChange={(v) => setValue("authorEmail", v)}
          />
        </InputContainer>
        <div>
          <Button isDisabled={!isSubmitAllowed} size="md" type="submit">
            Update config
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default GitUserSettings;
