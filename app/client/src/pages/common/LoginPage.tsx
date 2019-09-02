import * as React from "react"

import { Card, Elevation } from "@blueprintjs/core"
import { RouterProps } from "react-router";

class LoginPage extends React.PureComponent<RouterProps> {

  componentDidMount() {
    let windowDoc: any = window
    windowDoc.netlifyIdentity.open();
  }

  render() {
    return (
      <div style={{ textAlign: "center" }}>
      </div>
    )
  }
}

export default LoginPage


