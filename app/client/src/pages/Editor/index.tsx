import React, { Component } from 'react';
import { Card } from '@blueprintjs/core';
import Canvas from "./Canvas"

class Editor extends Component {
  render() {
    return (
        <div>
            <Canvas />
        </div>
    );
  }
}

export default Editor;
