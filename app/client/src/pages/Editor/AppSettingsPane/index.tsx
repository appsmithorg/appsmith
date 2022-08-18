import classNames from "classnames";
import React from "react";
interface AppSettingsPaneStyledProps {
  className?: string;
}

class AppSettingsPane extends React.Component<AppSettingsPaneStyledProps> {
  render() {
    return this.props.className ? (
      <div
        className={classNames({
          [`${this.props.className}`]: true,
        })}
      >
        abcd
      </div>
    ) : null;
  }
}

export default AppSettingsPane;
