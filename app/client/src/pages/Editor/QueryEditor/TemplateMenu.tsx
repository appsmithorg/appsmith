import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getPluginTemplates } from "selectors/entitiesSelector";

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
  pluginId: string;
}

type ReduxProps = {
  allPluginTemplates: Record<string, any>;
};

type Props = TemplateMenuProps & ReduxProps;

class TemplateMenu extends React.Component<Props> {
  nameInput!: HTMLDivElement | null;

  componentDidMount() {
    this.nameInput?.focus();
  }

  fetchTemplate = (queryType: string) => {
    const { pluginId, allPluginTemplates } = this.props;
    const pluginTemplates = allPluginTemplates[pluginId];

    if (pluginTemplates) {
      return pluginTemplates[queryType];
    }
  };

  render() {
    const { createTemplate, allPluginTemplates, pluginId } = this.props;
    const pluginTemplates = allPluginTemplates[pluginId];

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
          {Object.entries(pluginTemplates).map(template => {
            const templateKey = template[0];

            return (
              <Row
                key={templateKey}
                onClick={e => {
                  const template = this.fetchTemplate(templateKey);
                  createTemplate(template);
                  e.stopPropagation();
                }}
              >
                <BulletPoint />
                <Item>
                  {templateKey.charAt(0).toUpperCase() +
                    templateKey.slice(1).toLowerCase()}
                </Item>
              </Row>
            );
          })}
        </div>
      </Container>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    allPluginTemplates: getPluginTemplates(state),
  };
};

export default connect(mapStateToProps)(TemplateMenu);
