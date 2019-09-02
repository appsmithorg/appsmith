import * as React from "react"
import { RouterProps } from "react-router";
import netlifyIdentity from 'netlify-identity-widget';

class LoginPage extends React.PureComponent<RouterProps> {

    componentDidMount() {
        netlifyIdentity.open()
    }

    render() {
        return (
            <div style={{ textAlign: "center" }}>
            </div>
        )
    }
}

export default LoginPage


