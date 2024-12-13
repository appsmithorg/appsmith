import React, { useCallback, useEffect, useMemo } from "react";
import {
  AUTHOR_EMAIL_ONLY,
  AUTHOR_EMAIL_CANNOT_BE_EMPTY,
  AUTHOR_NAME_ONLY,
  AUTHOR_NAME_CANNOT_BE_EMPTY,
  FORM_VALIDATION_INVALID_EMAIL,
  GIT_USER_SETTINGS_TITLE,
  UPDATE,
  USE_DEFAULT_CONFIGURATION,
  createMessage,
} from "ee/constants/messages";
import styled, { keyframes } from "styled-components";
import { Button, Input, Switch, Text } from "@appsmith/ads";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { noop, omit } from "lodash";
import type { FetchLocalProfileResponseData } from "git/requests/fetchLocalProfileRequest.types";
import type { FetchGlobalProfileResponseData } from "git/requests/fetchGlobalProfileRequest.types";

const Container = styled.div`
  padding-top: 8px;
  padding-bottom: 8px;
`;

const HeadContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const BodyContainer = styled.div`
  display: flex;
  align-items: flex-end;
`;

const InputContainer = styled.div`
  margin-right: 12px;
  width: 240px;
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

interface AuthorInfo {
  authorName: string;
  authorEmail: string;
  useGlobalProfile: boolean;
}

interface LocalProfileProps {
  fetchGlobalProfile: () => void;
  fetchLocalProfile: () => void;
  globalProfile: FetchGlobalProfileResponseData | null;
  isFetchGlobalProfileLoading: boolean;
  isFetchLocalProfileLoading: boolean;
  localProfile: FetchLocalProfileResponseData | null;
  updateLocalProfile: (data: AuthorInfo) => void;
}

function LocalProfileView({
  fetchGlobalProfile = noop,
  fetchLocalProfile = noop,
  globalProfile = null,
  isFetchGlobalProfileLoading = false,
  isFetchLocalProfileLoading = false,
  localProfile = null,
  updateLocalProfile = noop,
}: LocalProfileProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<AuthorInfo>();

  const useGlobalProfile = watch("useGlobalProfile");
  const authorName = watch("authorName");
  const authorEmail = watch("authorEmail");

  const isLoading = isFetchGlobalProfileLoading || isFetchLocalProfileLoading;

  useEffect(
    function fetchProfilesOnInitEffect() {
      fetchGlobalProfile();
      fetchLocalProfile();
    },
    [fetchGlobalProfile, fetchLocalProfile],
  );

  useEffect(
    function setDefaultProfileOnInitEffect() {
      if (!isLoading) {
        setValue("useGlobalProfile", !!localProfile?.useGlobalProfile);
      }
    },
    [isLoading, setValue],
  );

  useEffect(
    function setValuesOnDefaultProfileChangeEffect() {
      if (!isLoading) {
        if (!useGlobalProfile && localProfile) {
          setValue("authorName", localProfile.authorName);
          setValue("authorEmail", localProfile.authorEmail);
        } else if (globalProfile) {
          setValue("authorName", globalProfile.authorName);
          setValue("authorEmail", globalProfile.authorEmail);
        }
      }
    },
    [isLoading, useGlobalProfile],
  );

  const onSubmit: SubmitHandler<AuthorInfo> = (data) => {
    if (data.useGlobalProfile && localProfile) {
      data.authorName = localProfile.authorName;
      data.authorEmail = localProfile.authorEmail;
    }

    updateLocalProfile(data);
  };

  const isSubmitAllowed = useMemo(() => {
    if (!isLoading) {
      if (useGlobalProfile) {
        return (
          authorName !== globalProfile?.authorName ||
          authorEmail !== globalProfile?.authorEmail ||
          useGlobalProfile !== localProfile?.useGlobalProfile
        );
      } else {
        return (
          authorName !== localProfile?.authorName ||
          authorEmail !== localProfile?.authorEmail ||
          useGlobalProfile !== localProfile?.useGlobalProfile
        );
      }
    } else {
      return false;
    }
  }, [
    isLoading,
    localProfile,
    globalProfile,
    useGlobalProfile,
    authorName,
    authorEmail,
  ]);

  const handleInputChange = useCallback(
    (key: "authorName" | "authorEmail") => (value: string) => {
      setValue(key, value);
    },
    [setValue],
  );

  const renderDefaultProfileSwitch = useCallback(
    ({ field }) => {
      return (
        <Switch
          data-testid="t--git-user-settings-switch"
          isDisabled={isLoading}
          {...omit(field, ["value"])}
          isSelected={field.value}
        >
          {createMessage(USE_DEFAULT_CONFIGURATION)}
        </Switch>
      );
    },
    [isLoading],
  );

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
              render={renderDefaultProfileSwitch}
            />
          </div>
        </HeadContainer>
        <BodyContainer>
          <InputContainer>
            {!isLoading ? (
              <Input
                data-testid="t--git-user-settings-author-name-input"
                errorMessage={errors?.authorName?.message}
                isReadOnly={useGlobalProfile}
                isValid={!errors?.authorName}
                label={createMessage(AUTHOR_NAME_ONLY)}
                size="md"
                type="text"
                {...register("authorName", {
                  required: createMessage(AUTHOR_NAME_CANNOT_BE_EMPTY),
                })}
                onChange={handleInputChange("authorEmail")}
              />
            ) : (
              <DummyField />
            )}
          </InputContainer>
          <InputContainer>
            {!isLoading ? (
              <Input
                data-testid="t--git-user-settings-author-email-input"
                errorMessage={errors?.authorEmail?.message}
                isReadOnly={useGlobalProfile}
                isValid={!errors?.authorEmail}
                label={createMessage(AUTHOR_EMAIL_ONLY)}
                size="md"
                {...register("authorEmail", {
                  required: createMessage(AUTHOR_EMAIL_CANNOT_BE_EMPTY),
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: createMessage(FORM_VALIDATION_INVALID_EMAIL),
                  },
                })}
                onChange={handleInputChange("authorEmail")}
              />
            ) : (
              <DummyField />
            )}
          </InputContainer>
          <Button
            isDisabled={!isSubmitAllowed}
            kind="secondary"
            size="md"
            type="submit"
          >
            {createMessage(UPDATE)}
          </Button>
        </BodyContainer>
      </form>
    </Container>
  );
}

export default LocalProfileView;
