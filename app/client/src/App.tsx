import React, { Component } from "react";
import { Helmet } from "react-helmet";

import "./App.css";
import "../node_modules/@blueprintjs/core/src/blueprint.scss";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Helmet>
          <title>Appsmith</title>
          <link rel="canonical" href="https://app.appsmith.com" />
        </Helmet>
        <header className="App-header">
          <p>Coming Soon</p>
        </header>
      </div>
    );
  }
}

export default App;
