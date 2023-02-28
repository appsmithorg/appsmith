import React from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import {
  notEmptyValidator,
  Text,
  TextInput,
  TextType,
} from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { forgotPasswordSubmitHandler } from "pages/UserAuth/helpers";
import {
  FORGOT_PASSWORD_SUCCESS_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { logoutUser, updateUserDetails } from "actions/userActions";
import UserProfileImagePicker from "./UserProfileImagePicker";
import { Wrapper, FieldWrapper, LabelWrapper } from "./StyledComponents";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { toast } from "design-system";
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
      toast.show(createMessage(FORGOT_PASSWORD_SUCCESS_TEXT, user?.email), {
        kind: "success",
      });
      dispatch(logoutUser());
    } catch (error) {
      toast.show((error as { _error: string })._error, {
        kind: "success",
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
        {
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
        }
      </FieldWrapper>
      <FieldWrapper>
        <LabelWrapper>
          <Text type={TextType.H4}>Email</Text>
        </LabelWrapper>
        <div style={{ flexDirection: "column", display: "flex" }}>
          {<Text type={TextType.P1}>{user?.email}</Text>}

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
