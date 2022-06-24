import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { Checkmark } from "components/ads/Checkbox";
import { Classes, Size } from "components/ads";
import Icon from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { Button } from "components/ads";
import { useDispatch } from "react-redux";
import { importTemplateIntoApplication } from "actions/templateActions";
import { Template } from "api/TemplatesApi";

const Wrapper = styled.div`
  width: max(300px, 25%);
  padding: 0px 20px;
  position: sticky;
  top: 0;
  position: -webkit-sticky;
  height: fit-content;
`;

const Card = styled.div`
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border: solid 1px #e7e7e7;

  hr {
    background-color: #b3b3b3;
    margin-top: 8px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .checkbox {
    margin-left: 8px;
  }
`;

const StyledCheckMark = styled(Checkmark)`
  width: 16px;
  height: 16px;

  &::after {
    width: 5px;
    height: 9px;
    top: 1px;
  }
`;

const CheckboxWrapper = styled.label`
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
  cursor: pointer;
  color: ${(props) => props.theme.colors.checkbox.labelColor};
  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  input:checked ~ ${StyledCheckMark}:after {
    display: block;
  }
`;

const Page = styled.div`
  .${Classes.ICON} {
    svg {
      height: 20px;
      width: 20px;
    }
    margin-right: 4px;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 23px;
`;

const StyledButton = styled(Button)`
  margin-top: 22px;
`;

type PageSelectionProps = {
  pageNames: string[];
  template: Template;
};

type CustomCheckboxProps = {
  onChange: (checked: boolean) => void;
  checked: boolean;
};

function CustomCheckbox(props: CustomCheckboxProps) {
  return (
    <CheckboxWrapper className="checkbox">
      <input
        checked={props.checked}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          props.onChange(e.target.checked);
        }}
        type="checkbox"
      />
      <StyledCheckMark
        backgroundColor={Colors.GREY_900}
        isChecked={props.checked}
      />
    </CheckboxWrapper>
  );
}

function PageSelection(props: PageSelectionProps) {
  const dispatch = useDispatch();
  const [selectedPages, setSelectedPages] = useState(props.pageNames);
  const pagesText =
    props.pageNames.length > 1 || props.pageNames.length === 0
      ? "Pages"
      : "Page";

  useEffect(() => {
    setSelectedPages(props.pageNames);
  }, [props.pageNames]);

  const onSelection = (selectedPageName: string, checked: boolean) => {
    if (checked) {
      if (!selectedPages.includes(selectedPageName)) {
        setSelectedPages((pages) => [...pages, selectedPageName]);
      }
    } else {
      setSelectedPages((pages) =>
        pages.filter((pageName) => pageName !== selectedPageName),
      );
    }
  };

  const onSelectAllToggle = (checked: boolean) => {
    if (checked) {
      setSelectedPages(props.pageNames);
    } else {
      setSelectedPages([]);
    }
  };

  const importPagesToApp = () => {
    dispatch(
      importTemplateIntoApplication(
        props.template.id,
        props.template.title,
        selectedPages,
      ),
    );
  };

  return (
    <Wrapper>
      <Card>
        <CardHeader>
          <Text type={TextType.H1}>
            {props.pageNames.length} {pagesText}
          </Text>
          <div className="flex">
            <Text type={TextType.P4}>Select all</Text>
            <CustomCheckbox
              checked={selectedPages.length === props.pageNames.length}
              onChange={onSelectAllToggle}
            />
          </div>
        </CardHeader>
        <hr />
        {props.pageNames.map((pageName) => {
          return (
            <Page key={pageName}>
              <div className="flex items-center">
                <Icon name="pages-line" />
                <Text type={TextType.P4}>{pageName.toUpperCase()}</Text>
              </div>
              <CustomCheckbox
                checked={selectedPages.includes(pageName)}
                onChange={(checked) => onSelection(pageName, checked)}
              />
            </Page>
          );
        })}
        <StyledButton
          disabled={!selectedPages.length}
          onClick={importPagesToApp}
          size={Size.large}
          tag="button"
          text="ADD SELECTED PAGES"
        />
      </Card>
    </Wrapper>
  );
}

export default PageSelection;
