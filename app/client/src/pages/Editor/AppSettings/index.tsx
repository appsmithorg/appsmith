import classNames from "classnames";
import React from "react";

interface AppSettingsStyledProps {
  className?: string;
}

class AppSettings extends React.Component<AppSettingsStyledProps> {
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

export default AppSettings;
