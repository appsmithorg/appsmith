import * as React from "react"

import { NonIdealState, Button, Card, Elevation } from "@blueprintjs/core"
import { RouterProps } from "react-router";

class PageNotFound extends React.PureComponent<RouterProps> {
  public render() {
    return (
      <div style={{ textAlign: "center" }}>
        <Card elevation={Elevation.TWO}>
          <NonIdealState
            icon={"search"}
            title="Page not found"
            description={
              "The page you were looking for does not appear to exist"
            }
            action={<Button onClick={() => { this.props.history.push("/") }}>{"Home"}</Button>}
          />
        </Card>
      </div>
    )
  }
}

export default PageNotFound
