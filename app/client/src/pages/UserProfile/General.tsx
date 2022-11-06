import React, { useEffect } from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import {
  notEmptyValidator,
  Text,
  TextInput,
  TextType,
  Toaster,
  Variant,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { Classes } from "@blueprintjs/core";
import { getCurrentUser } from "selectors/usersSelectors";
import { forgotPasswordSubmitHandler } from "pages/UserAuth/helpers";
import {
  FORGOT_PASSWORD_SUCCESS_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { logoutUser, updateUserDetails } from "actions/userActions";
import { AppState } from "@appsmith/reducers";
import UserProfileImagePicker from "./UserProfileImagePicker";
import {
  Wrapper,
  FieldWrapper,
  LabelWrapper,
  Loader,
  TextLoader,
} from "./StyledComponents";
import { getCurrentUser as refreshCurrentUser } from "actions/authActions";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
const { disableLoginForm } = getAppsmithConfigs();

const ForgotPassword = styled.a`
  margin-top: 12px;
  border-bottom: 1px solid transparent;
  &:hover {
    cursor: pointer;
    text-decoration: none;
  }
  display: inline-block;
`;

function General() {
  const user = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  const forgotPassword = async () => {
    try {
      await forgotPasswordSubmitHandler({ email: user?.email }, dispatch);
      Toaster.show({
        text: createMessage(FORGOT_PASSWORD_SUCCESS_TEXT, user?.email),
        variant: Variant.success,
      });
      dispatch(logoutUser());
    } catch (error) {
      Toaster.show({
        text: (error as { _error: string })._error,
        variant: Variant.success,
      });
    }
  };

  const timeout = 1000;
  const onNameChange = debounce((newName: string) => {
    dispatch(
      updateUserDetails({
        name: newName,
      }),
    );
  }, timeout);

  const isFetchingUser = useSelector(
    (state: AppState) => state.ui.users.loadingStates.fetchingUser,
  );

  useEffect(() => {
    dispatch(refreshCurrentUser());
  }, []);

  if (user?.email === ANONYMOUS_USERNAME) return null;

  return (
    <Wrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Display Picture</Text>
        </LabelWrapper>
        <UserProfileImagePicker />
      </FieldWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Display name</Text>
        </LabelWrapper>
        {isFetchingUser && <Loader className={Classes.SKELETON} />}
        {!isFetchingUser && (
          <div style={{ flex: 1 }}>
            <TextInput
              cypressSelector="t--display-name"
              defaultValue={user?.name}
              fill={false}
              onChange={onNameChange}
              placeholder="Display name"
              validator={notEmptyValidator}
            />
          </div>
        )}
      </FieldWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </LabelWrapper>
        <div style={{ flexDirection: "column", display: "flex" }}>
          {isFetchingUser && <TextLoader className={Classes.SKELETON} />}
          {!isFetchingUser && <Text type={TextType.P1}>{user?.email}</Text>}

          {!disableLoginForm && (
            <ForgotPassword onClick={forgotPassword}>
              Reset Password
            </ForgotPassword>
          )}
        </div>
      </FieldWrapper>
      {/* <InputWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Website</Text>
        </LabelWrapper>
        <TextInput
          placeholder="Your website"
          onChange={() => null}
          defaultValue={""}
          cypressSelector="t--profile-website"
        />
      </InputWrapper> */}
    </Wrapper>
  );
}

export default General;
