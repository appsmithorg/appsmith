import React, { ReactNode } from "react";

type ExplorerSectionProps = {
  children: ReactNode;
  /**
   * The title of the section, which will also determine the icon rendered next
   * to the headline.
   */
  title:
    | "Root Types"
    | "Fields"
    | "Deprecated Fields"
    | "Type"
    | "Arguments"
    | "Deprecated Arguments"
    | "Implements"
    | "Implementations"
    | "Possible Types"
    | "Enum Values"
    | "Deprecated Enum Values"
    | "Directives";
};

export default function ExplorerSection(props: ExplorerSectionProps) {
  // const Icon = TYPE_TO_ICON[props.title];
  return (
    <div>
      <div className="graphiql-doc-explorer-section-title">
        {/* <Icon /> */}
        {props.title}
      </div>
      <div className="graphiql-doc-explorer-section-content">
        {props.children}
      </div>
    </div>
  );
}

// const TYPE_TO_ICON: Record<ExplorerSectionProps['title'], ComponentType> = {
//   Arguments: ArgumentIcon,
//   'Deprecated Arguments': DeprecatedArgumentIcon,
//   'Deprecated Enum Values': DeprecatedEnumValueIcon,
//   'Deprecated Fields': DeprecatedFieldIcon,
//   Directives: DirectiveIcon,
//   'Enum Values': EnumValueIcon,
//   Fields: FieldIcon,
//   Implements: ImplementsIcon,
//   Implementations: TypeIcon,
//   'Possible Types': TypeIcon,
//   'Root Types': RootTypeIcon,
//   Type: TypeIcon,
// };
