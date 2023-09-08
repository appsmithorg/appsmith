import React from "react";
import styled from "styled-components";
import { Button, Text } from "design-system";

export type BlankStateProps = {
  image: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  buttonText?: string;
  onClick?: () => void;
};

const Wrapper = styled.div`
  svg {
    margin-bottom: 24px;
  }
`;

function BlankState(props: BlankStateProps) {
  const Illustration = props.image;

  return (
    <Wrapper className="flex flex-col items-center w-52 flex-1 justify-center">
      <Illustration />
      <Text className="text-center" color="#4C5664" kind="body-s">
        {props.description}
      </Text>
      {props.buttonText && props.onClick && (
        <Button className="mt-5" onClick={props.onClick}>
          {props.buttonText}
        </Button>
      )}
    </Wrapper>
  );
}

export default BlankState;
