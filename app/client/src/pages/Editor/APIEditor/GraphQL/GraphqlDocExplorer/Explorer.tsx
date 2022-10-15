import { Icon } from "@blueprintjs/core";
import { isType } from "graphql";
import React, { ReactNode, useContext } from "react";
import { ExplorerContext } from "./contexts/explorer";
import FieldDocumentation from "./FieldDocumentation";
import SchemaDocumentation from "./SchemaDocumentation";
import TypeDocumentation from "./TypeDocumentation";
import { Text, TextType } from "design-system";
import {
  DocExploreHeader,
  DocExplorerContent,
  DocExplorerSection,
  IconContainer,
} from "./css";

const DocExplorer = (props: any) => {
  const { isFetching, schema } = props;
  //remove
  const validationErrors: any = [];
  let fetchError;
  const explorerContextValue = useContext(ExplorerContext);

  if (!explorerContextValue) {
    return null;
  }

  const { pop, stack } = explorerContextValue;

  const navItem = stack[stack.length - 1];

  let content: ReactNode = null;
  if (fetchError) {
    content = (
      <div className="graphiql-doc-explorer-error">Error fetching schema</div>
    );
  } else if (validationErrors.length > 0) {
    content = (
      <div className="graphiql-doc-explorer-error">
        Schema is invalid: {validationErrors[0].message}
      </div>
    );
  } else if (isFetching) {
    // Schema is undefined when it is being loaded via introspection.
    content = <div>Loading</div>;
  } else if (!schema) {
    // Schema is null when it explicitly does not exist, typically due to
    // an error during introspection.
    content = (
      <div className="graphiql-doc-explorer-error">
        No GraphQL schema available
      </div>
    );
  } else if (stack.length === 1) {
    content = <SchemaDocumentation schema={schema} />;
  } else if (isType(navItem.def)) {
    content = <TypeDocumentation schema={schema} type={navItem.def} />;
  } else if (navItem.def) {
    content = <FieldDocumentation field={navItem.def} />;
  }

  let prevName;
  if (stack.length > 1) {
    prevName = stack[stack.length - 2].name;
  }

  return (
    <DocExplorerSection aria-label="Documentation Explorer">
      <DocExploreHeader>
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
          {navItem.name}
        </Text>
      </DocExploreHeader>
      {/* <div className="graphiql-doc-explorer-search">
        <Search key={navItem.name} />
      </div> */}
      <DocExplorerContent>{content}</DocExplorerContent>
    </DocExplorerSection>
  );
};

export default DocExplorer;
