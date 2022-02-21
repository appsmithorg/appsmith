import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import RequestTemplateSvg from "assets/images/request-template.svg";
import { Button, Size } from "components/ads";

const Wrapper = styled.div`
  border: 1px solid #e7e7e7;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: rgba(248, 248, 248, 0.5);
  transition: all 1s ease-out;
  margin-bottom: 32px;

  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }

  .title {
    margin-top: 21px;
  }

  .description {
    margin-top: 6px;
  }

  .button {
    margin-top: 19px;
    max-width: 229px;
    height: 36px;
    padding: 0px 15px;
  }
`;

const StyledImage = styled.img`
  height: 147px;
  object-fit: cover;
`;

function RequestTemplate() {
  const onClick = () => {
    window.open(
      "https://github.com/appsmithorg/appsmith/issues/new?assignees=Kocharrahul8&labels=Example+Apps&template=Templates.yaml&title=%5BTemplate%5D%3A+",
    );
  };

  return (
    <Wrapper>
      <StyledImage src={RequestTemplateSvg} />
      <Text className={"title"} type={TextType.H4}>
        Couldn’t find what you are looking for?
      </Text>
      <Text className={"description"} type={TextType.P3}>
        A github issue portal will be opened up for you to create an issue
        regarding what type of template you need.
      </Text>
      <Button
        className="button"
        onClick={onClick}
        size={Size.large}
        tag="button"
        text="Request for a template"
      />
    </Wrapper>
  );
}

export default RequestTemplate;
