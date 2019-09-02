import * as React from "react"
import _ from "lodash"
import { Route, Redirect } from "react-router-dom";

const ProtectedRoute = ({ path: path, component: Component, ...rest }: { path: string, component: React.ReactType }) => {
  let windowDoc: any = window
  return (<Route {...rest} render={(props) => (
    !_.isNil(windowDoc.netlifyIdentity.currentUser())
      ? <Component {...props} />
      : <Redirect to={"/login"} />
  )} />)
}

export default ProtectedRoute