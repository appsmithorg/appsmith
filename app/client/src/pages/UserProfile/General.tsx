import React from "react";
import { debounce } from "lodash";
import { Button, Input, toast } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import { forgotPasswordSubmitHandler } from "pages/UserAuth/helpers";
import {
  FORGOT_PASSWORD_SUCCESS_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { logoutUser, updateUserDetails } from "actions/userActions";
import UserProfileImagePicker from "./UserProfileImagePicker";
import { Wrapper, FieldWrapper } from "./StyledComponents";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
const { disableLoginForm } = getAppsmithConfigs();

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
        <UserProfileImagePicker />
      </FieldWrapper>
      <FieldWrapper>
        <Input
          data-test-id="t--display-name"
          defaultValue={user?.name}
          isRequired
          label="Display name"
          labelPosition="top"
          onChange={onNameChange}
          placeholder="Display name"
          renderAs="input"
          size="md"
          type="text"
        />
      </FieldWrapper>
      <FieldWrapper>
        <Input
          data-test-id="t--display-name"
          defaultValue={user?.email}
          isDisabled
          isReadOnly
          label="Email"
          labelPosition="top"
          placeholder="Display name"
          renderAs="input"
          size="md"
          type="text"
        />
      </FieldWrapper>
      <FieldWrapper>
        <div
          style={{
            display: "flex",
            flex: "1 1 0%",
            justifyContent: "flex-end",
          }}
        >
          {!disableLoginForm && (
            <Button
              kind="tertiary"
              onClick={forgotPassword}
              renderAs="a"
              size="md"
            >
              Reset Password
            </Button>
          )}
        </div>
      </FieldWrapper>
    </Wrapper>
  );
}

export default General;
