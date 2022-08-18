import React from "react";
import styled from "styled-components";
import { AppSettingsPaneProps } from "./props";

interface AppSettingsPaneStyledProps {
  className?: string;
}

class AppSettingsPane extends React.Component<
  AppSettingsPaneStyledProps & AppSettingsPaneProps
> {
  render() {
    return this.props.isOpen ? (
      <div className={this.props.className}>abcd</div>
    ) : null;
  }
}

const StyledAppSettingsPane = styled(AppSettingsPane)`
  width: 521px;
`;

export default StyledAppSettingsPane;
