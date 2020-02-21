import React from "react";
import { toast, ToastOptions, TypeOptions, ToastType } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import { theme } from "constants/DefaultTheme";
import { AlertIcons } from "icons/AlertIcons";

const ToastBody = styled.div<{ type: TypeOptions }>`
  height: 100%;
  border-left: 4px solid ${({ type }) => theme.alert[type].color};
  border-radius: 4px;
  background-color: white;
  color: black;
  display: flex;
  align-items: center;
  padding-left: 5px;
`;

const ToastMessage = styled.span`
  font-size: 16px;
  margin: 0 5px;
`;

const ToastIcon = {
  info: AlertIcons.INFO,
  success: AlertIcons.SUCCESS,
  error: AlertIcons.ERROR,
  warning: AlertIcons.WARNING,
  default: AlertIcons.INFO,
};

type Props = ToastOptions & { message: string; closeToast?: () => void };

const ToastComponent = (props: Props) => {
  const alertType = props.type || ToastType.INFO;
  const Icon = ToastIcon[alertType];
  return (
    <ToastBody type={alertType}>
      <Icon color={theme.alert[alertType].color} width={20} height={20} />
      <ToastMessage>{props.message}</ToastMessage>
    </ToastBody>
  );
};

const Toaster = {
  show: (config: ToastOptions & { message: string }) => {
    toast(<ToastComponent {...config} />);
  },
  clear: () => toast.dismiss(),
};

export const AppToaster = Toaster;
