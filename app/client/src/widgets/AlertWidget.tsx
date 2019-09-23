import React, { Component } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";

class AlertWidget extends Component {
  getPageView() {
    return <div />;
  }
}

export type AlertType = "DIALOG" | "NOTIFICATION";
export type MessageIntent = "SUCCESS" | "ERROR" | "INFO" | "WARNING";

export interface AlertWidgetProps extends WidgetProps {
  alertType: AlertType;
  intent: MessageIntent;
  header: string;
  message: string;
  onPrimaryClick: ActionPayload[];
}

export default AlertWidget;
