import React from "react";
import styled from "styled-components";
import Templates from "./Templates";

const Container = styled.div`
  display: flex;
  height: 185px;
  padding: 16px 24px;
  flex: 1;
  border-radius: 4px;
  border: 1px solid #d0d7dd;
  flex-direction: column;
  color: #4e5d78;
`;

const BulletPoint = styled.div`
  height: 4px;
  width: 4px;
  border-radius: 2px;
  background-color: #c4c4c4;
`;

const Item = styled.div`
  font-size: 14px;
  line-height: 11px;
  margin-left: 6px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 9px;
  width: 108px;
  cursor: pointer;

  :hover {
    background-color: #ebeff2;
    border-radius: 4px;
  }
`;

interface TemplateMenuProps {
  createTemplate: (template: any) => void;
  selectedPluginPackage: string;
}

type Props = TemplateMenuProps;

class TemplateMenu extends React.Component<Props> {
  nameInput!: HTMLDivElement | null;

  componentDidMount() {
    this.nameInput?.focus();
  }

  fetchTemplate = (queryType: React.ReactText) => {
    const { selectedPluginPackage } = this.props;
    const allTemplates = Templates[selectedPluginPackage];

    if (allTemplates) {
      return allTemplates[queryType];
    }
  };

  render() {
    const { createTemplate } = this.props;

    return (
      <Container
        className="t--template-menu"
        ref={input => {
          this.nameInput = input;
        }}
        tabIndex={0}
        onKeyPress={e => {
          e.preventDefault();

          if (e.key === "Enter") {
            createTemplate("");
          }
        }}
        onClick={() => createTemplate("")}
      >
        <div style={{ fontSize: 14 }}>
          Press enter to start with a blank state or select a template.
        </div>
        <div style={{ marginTop: "6px" }}>
          <Row
            onClick={e => {
              const template = this.fetchTemplate("create");
              createTemplate(template);
              e.stopPropagation();
            }}
          >
            <BulletPoint />
            <Item>Create</Item>
          </Row>
          <Row
            onClick={e => {
              const template = this.fetchTemplate("read");
              createTemplate(template);
              e.stopPropagation();
            }}
          >
            <BulletPoint />
            <Item>Read</Item>
          </Row>
          <Row
            onClick={e => {
              const template = this.fetchTemplate("delete");
              createTemplate(template);
              e.stopPropagation();
            }}
          >
            <BulletPoint />
            <Item>Delete</Item>
          </Row>
          <Row
            onClick={e => {
              const template = this.fetchTemplate("update");
              createTemplate(template);
              e.stopPropagation();
            }}
          >
            <BulletPoint />
            <Item>Update</Item>
          </Row>
        </div>
      </Container>
    );
  }
}

export default TemplateMenu;
