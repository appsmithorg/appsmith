import React from "react";
import { toast, ToastOptions, TypeOptions, ToastType } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import { theme } from "constants/DefaultTheme";
import { AlertIcons } from "icons/AlertIcons";
import { ReduxAction } from "constants/ReduxActionConstants";
import { useDispatch } from "react-redux";

const ToastBody = styled.div<{ type: TypeOptions; action: string }>`
  height: 100%;
  border-left: 4px solid ${({ type }) => theme.alert[type].color};
  border-radius: 4px;
  background-color: white;
  color: black;
  padding-left: 5px;
  display: grid;
  grid-template-columns: ${props =>
    props.action === "enabled" ? "20px 212px 60px" : "20px auto"};
  align-items: center;
`;

const ToastMessage = styled.span`
  font-size: ${props => props.theme.fontSizes[3]}px;
  margin: 0 5px;
`;

const ToastAction = styled.button`
  border: none;
  background: rgba(214, 65, 95, 0.08);

  color: #d6415f;
  font-size: 12px;
  font-weight: bold;
  padding: 10px;
  text-transform: uppercase;
  cursor: pointer;
  float: right;
  &:hover {
    background: rgba(214, 65, 95, 0.2);
  }
`;

const ToastIcon = {
  info: AlertIcons.INFO,
  success: AlertIcons.SUCCESS,
  error: AlertIcons.ERROR,
  warning: AlertIcons.WARNING,
  default: AlertIcons.INFO,
};

type Props = ToastOptions & {
  message: string;
  closeToast?: () => void;
  action?: { text: string; dispatchableAction: ReduxAction<any> };
};

const ToastComponent = (props: Props) => {
  const dispatch = useDispatch();
  const alertType = props.type || ToastType.INFO;
  const Icon = ToastIcon[alertType];
  return (
    <ToastBody
      type={alertType}
      action={!!props.action ? "enabled" : "disabled"}
    >
      <Icon color={theme.alert[alertType].color} width={20} height={20} />
      <ToastMessage>{props.message}</ToastMessage>
      {props.action && (
        <ToastAction
          className="t--toast-action"
          onClick={() => {
            dispatch(props.action?.dispatchableAction);
            props.closeToast && props.closeToast();
          }}
        >
          {props.action.text}
        </ToastAction>
      )}
    </ToastBody>
  );
};

const Toaster = {
  show: (config: Props) => {
    if (typeof config.message !== "string") {
      console.error("Toast message needs to be a string");
      return;
    }
    toast(
      <ToastComponent
        {...config}
        closeToast={config.closeToast || toast.dismiss}
      />,
      {
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        autoClose: config.autoClose || 4000,
        hideProgressBar:
          config.hideProgressBar === undefined ? true : config.hideProgressBar,
      },
    );
  },
  clear: () => toast.dismiss(),
};

export const AppToaster = Toaster;
