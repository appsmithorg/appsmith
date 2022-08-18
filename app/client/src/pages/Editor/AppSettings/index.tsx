import React from "react";

interface AppSettingsProps {
  className?: string;
}

class AppSettings extends React.Component<AppSettingsProps> {
  render() {
    return <div className={this.props.className}>abcd</div>;
  }
}

export default AppSettings;
