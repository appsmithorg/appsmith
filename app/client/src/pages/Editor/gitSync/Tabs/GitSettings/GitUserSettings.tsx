import React, { useEffect, useMemo } from "react";
import { Space } from "../../components/StyledComponents";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  GIT_USER_SETTINGS_TITLE,
  USE_DEFAULT_CONFIGURATION,
  createMessage,
} from "@appsmith/constants/messages";
import styled, { keyframes } from "styled-components";
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

const InputContainer = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
`;

const SectionTitle = styled(Text)`
  font-weight: 600;
`;

const loadingKeyframe = keyframes`
    100% {
      transform: translateX(100%);
    }
`;

const DummyLabel = styled.div`
  height: 17px;
  width: 100px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: var(--ads-color-black-100);
  position: relative;

  overflow: hidden;

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.5) 20%,
      rgba(255, 255, 255, 0.8) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: ${loadingKeyframe} 5s infinite;
    content: "";
  }
`;

const DummyInput = styled.div`
  height: 36px;
  border-radius: 4px;
  background-color: linear-gradient(
    90deg,
    var(--ads-color-black-200) 0%,
    rgba(240, 240, 240, 0) 100%
  );
  background-color: var(--ads-color-black-100);
  position: relative;

  overflow: hidden;

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.5) 20%,
      rgba(255, 255, 255, 0.8) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: ${loadingKeyframe} 5s infinite;
    content: "";
  }
`;

const DummyField = () => {
  return (
    <div style={{ width: "100%" }}>
      <DummyLabel />
      <DummyInput />
    </div>
  );
};

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
    if (data.useGlobalProfile) {
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

  const loading = isFetchingGlobalGitConfig || isFetchingLocalGitConfig;

  return (
    <Container>
      <form onSubmit={handleSubmit(onSubmit)}>
        <HeadContainer>
          <SectionTitle kind="heading-s">
            {createMessage(GIT_USER_SETTINGS_TITLE)}
          </SectionTitle>
          <div>
            <Controller
              control={control}
              name="useGlobalProfile"
              render={({ field }) => {
                return (
                  <Switch
                    data-testid="t--git-user-settings-switch"
                    isDisabled={loading}
                    {...omit(field, ["value"])}
                    isSelected={field.value}
                  >
                    {createMessage(USE_DEFAULT_CONFIGURATION)}
                  </Switch>
                );
              }}
            />
          </div>
        </HeadContainer>

        <Space size={5} />
        <InputContainer>
          {!loading ? (
            <Input
              data-testid="t--git-user-settings-author-name-input"
              // errorMessage={
              //   nameInvalid ? createMessage(AUTHOR_NAME_CANNOT_BE_EMPTY) : ""
              // }
              isReadOnly={useGlobalProfile}
              // isValid={!nameInvalid}
              label={createMessage(AUTHOR_NAME)}
              // isLoading={isFetchingConfig}
              size="md"
              type="text"
              {...register("authorName", { required: true })}
              // onChange is overwritten with setValue
              onChange={(v) => setValue("authorName", v)}
            />
          ) : (
            <DummyField />
          )}
        </InputContainer>
        <InputContainer>
          {!loading ? (
            <Input
              data-testid="t--git-user-settings-author-email-input"
              // errorMessage={
              //   emailInvalid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : ""
              // }
              isReadOnly={useGlobalProfile}
              // isValid={!emailInvalid}
              label={createMessage(AUTHOR_EMAIL)}
              size="md"
              type="email"
              {...register("authorEmail", { required: true })}
              // onChange is overwritten with setValue
              onChange={(v) => setValue("authorEmail", v)}
            />
          ) : (
            <DummyField />
          )}
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
