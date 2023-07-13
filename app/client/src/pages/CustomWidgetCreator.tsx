import React, { useRef } from "react";
import { Button } from "design-system";
import styled from "styled-components";

const Container = styled.div`
  width: 200px;
  height: 200px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const TextArea = styled.textarea`
  width: 200px;
  height: 200px;
  border: 1px solid #000;
`;

const StyledButton = styled(Button)``;

export const binId = "64afd26cb89b1e2299be44ee";

export function CustomWidgetCreator() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const name = useRef<HTMLInputElement>(null);

  const onClick = async () => {
    const value = ref.current?.value;
    if (value) {
      try {
        JSON.parse(value);
      } catch (e) {
        alert("invalid json");
        return;
      }
      const response = await fetch(
        `https://api.jsonbin.io/v3/b/${binId}/latest`,
      );

      const existingValues = await response.json();

      await fetch(`https://api.jsonbin.io/v3/b/${binId}/`, {
        method: "PUT",
        body: JSON.stringify([
          ...existingValues.record,
          {
            ...JSON.parse(value),
            type: Math.random().toString(16).slice(2),
            name: name.current?.value,
          },
        ]),
        headers: new Headers({ "content-type": "application/json" }),
      });
    }
  };

  return (
    <Container>
      <div>
        <label>Name</label>
        <input ref={name} />
      </div>
      <div>
        <label>configuration</label>
        <TextArea ref={ref} />
      </div>
      <div>
        <StyledButton onClick={onClick}>CREATE</StyledButton>
      </div>
    </Container>
  );
}
