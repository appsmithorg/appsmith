import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { getPluginTemplates } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const Container = styled.div`
  display: flex;
  /* padding: 16px 24px; */
  flex: 1;
  border-radius: var(--ads-v2-border-radius);
  flex-direction: column;
  color: var(--ads-v2-color-fg);
`;

const BulletPoint = styled.div`
  height: 4px;
  width: 4px;
  border-radius: 2px;
  background-color: var(--ads-v2-color-fg);
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
  padding: var(--ads-v2-spaces-4);
  width: 108px;
  margin-top: var(--ads-v2-spaces-2);
  cursor: pointer;

  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
    border-radius: var(--ads-v2-border-radius);
  }
`;

interface TemplateMenuProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTemplate: (template: any) => void;
  pluginId: string;
}

interface ReduxProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allPluginTemplates: Record<string, any>;
}

type Props = TemplateMenuProps & ReduxProps;

class TemplateMenu extends React.Component<Props> {
  nameInput!: HTMLDivElement | null;

  fetchTemplate = (queryType: string) => {
    const { allPluginTemplates, pluginId } = this.props;
    const pluginTemplates = allPluginTemplates[pluginId];

    if (pluginTemplates) {
      return pluginTemplates[queryType];
    }
  };

  render() {
    const { allPluginTemplates, createTemplate, pluginId } = this.props;
    const pluginTemplates = allPluginTemplates[pluginId];

    return (
      <Container
        className="t--template-menu"
        onClick={() => createTemplate("")}
        onKeyPress={(e) => {
          e.preventDefault();

          if (e.key === "Enter") {
            createTemplate("");
          }
        }}
        ref={(input) => {
          this.nameInput = input;
        }}
        tabIndex={0}
      >
        <div>Click here to start with a blank state or select a template.</div>
        <div>
          {Object.entries(pluginTemplates).map((template) => {
            const templateKey = template[0];

            return (
              <Row
                key={templateKey}
                onClick={(e) => {
                  const template = this.fetchTemplate(templateKey);
                  createTemplate(template);
                  AnalyticsUtil.logEvent("QUERY_TEMPLATE_SELECTED", {
                    templateType: templateKey,
                  });
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
