import React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import CalloutComponent from "../editorComponents/CalloutComponent";
import { ActionPayload } from '../constants/ActionConstants';

class AlertWidget extends BaseWidget<AlertWidgetProps, IWidgetState> {
  getPageView() {
    return (
      <div/>
    );
  }

  getWidgetType(): WidgetType {
    return "ALERT_WIDGET";
  }
}

export type AlertType = "DIALOG" | "NOTIFICATION"
export type MessageIntent = "SUCCESS" | "ERROR" | "INFO" | "WARNING" 

export interface AlertWidgetProps extends IWidgetProps {
  alertType: AlertType
  intent: MessageIntent
  header: string
  message: string
  onPrimaryClick: ActionPayload[]
}

export default AlertWidget;
