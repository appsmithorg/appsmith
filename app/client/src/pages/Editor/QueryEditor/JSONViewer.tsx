import React from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import { Card } from "@blueprintjs/core";

const OutputContainer = styled.div`
  background: #f5f6f7;
  border: 1px solid #d0d7dd;
  box-sizing: border-box;
  padding: 6px;
`;

const ResponseContent = styled.div`
  overflow: auto;
`;

const Record = styled(Card)`
  margin: 5px;
  border-radius: 0;
  span.string-value {
    overflow-wrap: anywhere;
  }
`;

type JSONOutputProps = {
  src: Record<string, any>[];
};

type Props = JSONOutputProps;

class JSONOutput extends React.Component<Props> {
  render() {
    const { src } = this.props;
    const reactJsonProps = {
      name: null,
      enableClipboard: false,
      displayObjectSize: false,
      displayDataTypes: false,
      style: {
        fontSize: "14px",
      },
      collapsed: 1,
    };

    if (typeof src !== "object") {
      return <OutputContainer>{src}</OutputContainer>;
    }

    if (!src.length) {
      return (
        <ResponseContent>
          <OutputContainer>
            <Record>
              <ReactJson src={src} {...reactJsonProps} />
            </Record>
          </OutputContainer>
        </ResponseContent>
      );
    }

    return (
      <ResponseContent>
        <OutputContainer>
          {src.map((record, index) => {
            return (
              <Record key={index}>
                <ReactJson src={record} {...reactJsonProps} />
              </Record>
            );
          })}
        </OutputContainer>
      </ResponseContent>
    );
  }
}

export default JSONOutput;
