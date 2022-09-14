import React, { useEffect, useState } from "react";
import styled from "styled-components";
import PagesLineIcon from "remixicon-react/PagesLineIcon";
import { CheckboxType, Text, TextType, IconWrapper } from "design-system";
import { Checkmark, Size, Button } from "design-system";
import { useDispatch } from "react-redux";
import { importTemplateIntoApplication } from "actions/templateActions";
import { Template } from "api/TemplatesApi";
import { ApplicationPagePayload } from "api/ApplicationApi";
import {
  createMessage,
  FILTER_SELECTALL,
  FILTER_SELECT_PAGES,
  PAGE,
  PAGES,
} from "ce/constants/messages";
import { Colors } from "constants/Colors";
import { Classes } from "components/ads";

const Wrapper = styled.div`
  width: max(300px, 25%);
  padding-left: ${(props) => props.theme.spaces[9]}px;
  position: sticky;
  top: 0;
  position: -webkit-sticky;
  height: fit-content;
`;

const Card = styled.div`
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  padding: ${(props) => props.theme.spaces[9]}px;
  border: solid 1px ${Colors.GREY_4};

  hr {
    background-color: ${Colors.GRAY_400};
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .checkbox {
    margin-left: ${(props) => props.theme.spaces[3]}px;
  }
`;

const StyledCheckMark = styled(Checkmark)`
  width: 16px;
  height: 16px;
  ${(props) => !props.isChecked && `border: 1.8px solid ${Colors.GRAY_400};`}

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
    margin-right: ${(props) => props.theme.spaces[1]}px;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${(props) => props.theme.spaces[11]}px;
`;

const PageName = styled.div`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const StyledButton = styled(Button)`
  margin-top: ${(props) => props.theme.spaces[11]}px;
`;

type PageSelectionProps = {
  pages: ApplicationPagePayload[];
  template: Template;
  onPageSelection: (pageId: string) => void;
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
        type={CheckboxType.PRIMARY}
      />
    </CheckboxWrapper>
  );
}

function PageSelection(props: PageSelectionProps) {
  const dispatch = useDispatch();
  const [selectedPages, setSelectedPages] = useState(
    props.pages.map((page) => page.name),
  );
  const pagesText =
    props.pages.length > 1 || props.pages.length === 0
      ? createMessage(PAGES)
      : createMessage(PAGE);

  useEffect(() => {
    setSelectedPages(props.pages.map((page) => page.name));
  }, [props.pages]);

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
      setSelectedPages(props.pages.map((page) => page.name));
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
            {props.pages.length} {pagesText}
          </Text>
          <div className="flex">
            <Text type={TextType.P4}>{createMessage(FILTER_SELECTALL)}</Text>
            <CustomCheckbox
              checked={selectedPages.length === props.pages.length}
              onChange={onSelectAllToggle}
            />
          </div>
        </CardHeader>
        <hr />
        {props.pages.map((page) => {
          return (
            <Page key={page.id}>
              <PageName
                className="flex items-center"
                onClick={() => props.onPageSelection(page.id)}
              >
                <IconWrapper className={Classes.ICON}>
                  <PagesLineIcon />
                </IconWrapper>
                <Text type={TextType.P4}>{page.name.toUpperCase()}</Text>
              </PageName>
              <CustomCheckbox
                checked={selectedPages.includes(page.name)}
                onChange={(checked) => onSelection(page.name, checked)}
              />
            </Page>
          );
        })}
        <StyledButton
          data-cy="template-fork-button"
          disabled={!selectedPages.length}
          onClick={importPagesToApp}
          size={Size.large}
          tag="button"
          text={createMessage(FILTER_SELECT_PAGES)}
          width="100%"
        />
      </Card>
    </Wrapper>
  );
}

export default PageSelection;
