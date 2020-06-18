import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { PageListItemCSS } from "./PageListItem";
import Button from "components/editorComponents/Button";

/** Create Page Button / Input */

const CreatePageWrapper = styled.div`
  ${PageListItemCSS};
  & {
    button,
    button span {
      color: ${props => props.theme.colors.textOnDarkBG};
    }
  }
`;

type CreatePageProps = {
  onCreatePage: (name: string) => void;
  defaultValue: string;
  loading: boolean;
};
const CreatePageButton = (props: CreatePageProps) => {
  const [isCreatePageFieldVisible, showCreatePageField] = useState(false);
  const onChange = (value: string) => {
    props.onCreatePage(value);
    showCreatePageField(false);
  };
  let content: ReactNode;
  if (isCreatePageFieldVisible) {
    content = (
      <EditableText
        className="t--page-name-input"
        type="text"
        placeholder="Enter page name"
        isEditingDefault
        defaultValue={props.defaultValue}
        onTextChanged={onChange}
        editInteractionKind={EditInteractionKind.SINGLE}
      />
    );
  } else {
    content = (
      <Button
        className="t--add-page-btn"
        loading={props.loading}
        text="Add Page"
        icon="plus"
        iconAlignment="left"
        onClick={() => showCreatePageField(true)}
      />
    );
  }
  return <CreatePageWrapper>{content}</CreatePageWrapper>;
};

export default CreatePageButton;
