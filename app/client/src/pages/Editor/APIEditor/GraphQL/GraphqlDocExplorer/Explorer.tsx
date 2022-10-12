import { isType } from "graphql";
import React, { ReactNode, useContext } from "react";
import { ExplorerContext } from "./contexts/explorer";
import FieldDocumentation from "./FieldDocumentation";
import SchemaDocumentation from "./SchemaDocumentation";
import TypeDocumentation from "./TypeDocumentation";

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
    <section
      aria-label="Documentation Explorer"
      className="graphiql-doc-explorer"
    >
      <div className="graphiql-doc-explorer-header">
        <div className="graphiql-doc-explorer-header-content">
          {prevName && (
            <a
              aria-label={`Go back to ${prevName}`}
              className="graphiql-doc-explorer-back"
              href="#"
              onClick={pop}
            >
              back button
              {prevName}
            </a>
          )}
          <div className="graphiql-doc-explorer-title">{navItem.name}</div>
        </div>
        <div className="graphiql-doc-explorer-search">
          {/* <Search key={navItem.name} /> */}
        </div>
      </div>
      <div className="graphiql-doc-explorer-content">{content}</div>
    </section>
  );
};

export default DocExplorer;
