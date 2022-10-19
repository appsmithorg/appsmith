import { Icon } from "@blueprintjs/core";
import { isType } from "graphql";
import React, { ReactNode, useContext } from "react";
import { ExplorerContext } from "./contexts/explorer";
import FieldDocumentation from "./FieldDocumentation";
import SchemaDocumentation from "./SchemaDocumentation";
import TypeDocumentation from "./TypeDocumentation";
import { Text, TextType } from "design-system";
import {
  DocExplorerContent,
  DocExplorerErrorWrapper,
  DocExplorerHeader,
  DocExplorerLoading,
  DocExplorerSection,
  IconContainer,
} from "./css";
import Search from "./Search";

type DocExplorerType = {
  error?: any;
  isFetching: boolean;
  schema?: any;
  validationErrors?: any;
};

const DocExplorer = (props: DocExplorerType) => {
  const { error, isFetching, schema } = props;
  const explorerContextValue = useContext(ExplorerContext);

  if (!explorerContextValue) {
    return null;
  }

  const { pop, stack } = explorerContextValue;

  const stackItem = stack[stack.length - 1];

  let content: ReactNode = null;
  // remove condition of schema check
  if (error && !schema) {
    content = <DocExplorerErrorWrapper>{error}</DocExplorerErrorWrapper>;
  } else if (props.validationErrors) {
    content = (
      <DocExplorerErrorWrapper>
        Schema is invalid: {props.validationErrors}
      </DocExplorerErrorWrapper>
    );
  } else if (isFetching) {
    content = <DocExplorerLoading>Loading</DocExplorerLoading>;
  } else if (!schema) {
    content = (
      <DocExplorerErrorWrapper>
        No GraphQL schema available
      </DocExplorerErrorWrapper>
    );
  } else if (stack.length === 1) {
    content = <SchemaDocumentation schema={schema} />;
  } else if (isType(stackItem.def)) {
    content = <TypeDocumentation schema={schema} type={stackItem.def} />;
  } else if (stackItem.def) {
    content = <FieldDocumentation field={stackItem.def} />;
  }

  let prevName;
  if (stack.length > 1) {
    prevName = stack[stack.length - 2].name;
  }

  return (
    <DocExplorerSection aria-label="Documentation Explorer">
      <DocExplorerHeader>
        <IconContainer
          className="t--gql-back-explorer"
          onClick={pop}
          showPointer={!!prevName}
        >
          {prevName && <Icon icon="chevron-left" iconSize={16} />}
        </IconContainer>
        <Text
          style={{ color: "#0c0000", lineHeight: "14px", flexGrow: "1" }}
          type={TextType.P1}
        >
          {stackItem.name}
        </Text>
      </DocExplorerHeader>
      <Search schema={schema} />
      <DocExplorerContent>{content}</DocExplorerContent>
    </DocExplorerSection>
  );
};

export default DocExplorer;
