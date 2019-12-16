import React, { ChangeEvent, Component, KeyboardEvent } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import _ from "lodash";
import {
  getDynamicAutocompleteSearchTerm,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import {
  BaseTextInput,
  TextInputProps,
} from "components/designSystems/appsmith/TextInputComponent";
import {
  getNameBindingsWithData,
  NameBindingsWithData,
} from "selectors/nameBindingsWithDataSelector";
import TreeMenu, {
  MatchSearchFunction,
  TreeMenuItem,
  TreeNodeInArray,
} from "react-simple-tree-menu";
import { DATA_BIND_AUTOCOMPLETE } from "constants/BindingsConstants";
import DataTreeNode from "components/editorComponents/DataTreeNode";
import { transformToTreeStructure } from "utils/DynamicTreeAutoCompleteUtils";

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
`;

const DataTreeWrapper = styled.div`
  position: absolute;
  top: 33px;
  z-index: 21;
  padding: 10px;
  max-height: 400px;
  width: 450px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ebeff2;
  box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
  border-radius: 4px;
  font-size: 14px;
  text-transform: none;
`;

const NoResultsMessage = styled.p`
  color: ${props => props.theme.colors.textDefault};
`;

interface ReduxStateProps {
  dynamicData: NameBindingsWithData;
}

type Props = ReduxStateProps & TextInputProps;

type State = {
  tree: TreeNodeInArray[];
  showTree: boolean;
  focusedNode: string;
};

class DynamicAutocompleteInput extends Component<Props, State> {
  private input: HTMLInputElement | null = null;
  private search: Function | undefined;
  constructor(props: Props) {
    super(props);
    this.state = {
      tree: [],
      showTree: true,
      focusedNode: "",
    };
  }
  componentDidMount(): void {
    this.updateTree();
  }
  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (prevProps.dynamicData !== this.props.dynamicData) {
      this.updateTree();
    }
    this.updateTreeVisibility();
  }
  updateTreeVisibility = () => {
    const { showTree } = this.state;
    const { input } = this.props;
    let value;
    let hasIncomplete = 0;
    if (input && input.value) {
      value = input.value;
    }
    if (value && typeof value === "string") {
      const { bindings, paths } = getDynamicBindings(value);
      bindings.forEach((binding, i) => {
        if (binding.indexOf("{{") > -1 && paths[i] === "") {
          hasIncomplete++;
        }
      });
    }

    if (showTree) {
      if (hasIncomplete === 0) {
        this.setState({ showTree: false });
      }
    } else {
      if (hasIncomplete > 0) {
        this.setState({ showTree: true });
      }
    }
  };
  handleNodeSearch: MatchSearchFunction = ({ path, searchTerm }) => {
    const lowerCasePath = path.toLowerCase();
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchPath = lowerCasePath.substr(0, searchTerm.length);
    return matchPath === lowerCaseSearchTerm;
  };
  updateTree = () => {
    const { dynamicData } = this.props;
    const filters = Object.keys(dynamicData).map(name => ({ name }));
    const tree = transformToTreeStructure(
      dynamicData,
      filters.map(f => f.name),
    );
    this.setState({ tree });
  };
  handleNodeSelected = (node: any) => {
    if (this.props.input && this.props.input.value) {
      const currentValue = String(this.props.input.value);
      const path = node.path;
      const { bindings, paths } = getDynamicBindings(currentValue);
      const autoComplete = bindings.map((binding, i) => {
        if (binding.indexOf("{{") > -1 && paths[i] === "") {
          return binding.replace(DATA_BIND_AUTOCOMPLETE, `{{${path}}}`);
        }
        return binding;
      });
      this.props.input.onChange &&
        this.props.input.onChange(autoComplete.join(""));
      this.input && this.input.focus();
    }
  };
  setInputRef = (ref: HTMLInputElement | null) => {
    if (ref) {
      this.input = ref;
    }
  };
  handleInputChange = (e: ChangeEvent<{ value: string }>) => {
    if (this.props.input && this.props.input.onChange) {
      this.props.input.onChange(e);
    }
    const value = e.target.value;
    if (this.search) {
      const { bindings, paths } = getDynamicBindings(value);
      bindings.forEach((binding, i) => {
        if (binding.indexOf("{{") > -1 && paths[i] === "") {
          const query = getDynamicAutocompleteSearchTerm(binding);
          this.search && this.search(query);
        }
      });
    }
  };

  handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT"
      ) {
        const tree = document.getElementById("tree");
        const container =
          tree && tree.closest<HTMLDivElement>("[tabindex='0']");
        if (container) {
          container.focus();
        }
      }
    }
  };

  render() {
    const { input, ...rest } = this.props;
    return (
      <Wrapper onKeyDown={this.handleKeyDown}>
        <BaseTextInput
          refHandler={this.setInputRef}
          input={{
            ...input,
            onChange: this.handleInputChange,
          }}
          {..._.omit(rest, ["dynamicData", "dispatch"])}
        />
        {this.state.showTree && this.state.tree.length && (
          <TreeMenu
            data={this.state.tree}
            matchSearch={this.handleNodeSearch}
            onClickItem={this.handleNodeSelected}
            initialFocusKey={this.state.tree[0].key}
            disableKeyboard={false}
          >
            {({ search, items }) => (
              <DataTreeWrapper id="tree">
                {items.length === 0 ? (
                  <NoResultsMessage>No results found</NoResultsMessage>
                ) : (
                  items.map((item: TreeMenuItem) => {
                    this.search = search;
                    return <DataTreeNode key={item.key} item={item} />;
                  })
                )}
              </DataTreeWrapper>
            )}
          </TreeMenu>
        )}
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getNameBindingsWithData(state),
});

export default connect(mapStateToProps)(DynamicAutocompleteInput);
