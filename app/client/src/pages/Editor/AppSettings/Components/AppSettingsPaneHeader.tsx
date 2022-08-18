import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import React from "react";
import { connect } from "react-redux";

class AppSettingsPaneHeaderComponent extends React.Component<{
  closePane: () => void;
}> {
  render() {
    return <button onClick={this.props.closePane}>Close panel</button>;
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  closePane: () => {
    dispatch(closeAppSettingsPaneAction());
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(AppSettingsPaneHeaderComponent);
