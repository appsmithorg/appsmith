import { Checkbox, Icon, Radio } from "@blueprintjs/core";
import React, { Key, useEffect, useState } from "react";
import styled from "styled-components";
import EventEmitter from "utils/EventEmitter";

const Container = styled.div`
  margin-top: 2rem;
`;
const ContainerTitle = styled.div`
  display: grid;
  grid-template-columns: 1fr 30px;
  cursor: pointer;

  & .title {
    color: #090707;
    padding: 6px 0;
    font-size: 16px;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    font-weight: normal;
    -webkit-box-pack: start;
    -webkit-justify-content: flex-start;
    -ms-flex-pack: start;
    justify-content: flex-start;
    -webkit-align-items: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    margin: 0;
  }

  & .bp3-icon {
    cursor: pointer;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-align-items: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-transition: none;
    transition: none;
  }
`;

const Collapse = styled.div``;

const FeedBacks = [
  {
    key: "main",
    label: "Main",
    value: true,
  },
  {
    key: "abhinavsSuggesstion",
    label: "Abhinav's suggestion to add a input control beside the slider.",
    value: false,
  },
  {
    key: "abhisheksSuggestion",
    label: "Abhishek's suggestion to show slider only when input is clicked.",
    value: false,
  },
];

const EmptyState = () =>
  FeedBacks.reduce((acc: Record<string, boolean>, it) => {
    acc[it.key] = false;
    return acc;
  }, {});

const InitialNewState = () =>
  FeedBacks.reduce((acc: Record<string, boolean>, it) => {
    acc[it.key] = it.value;
    return acc;
  }, {});

const localStorageKey = "dh-feedbacks";

const MemInitialState = () => {
  try {
    const value = localStorage.getItem(localStorageKey);
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return InitialNewState();
    }
  } catch (e) {
    return InitialNewState();
  }
};

export const FeedbackState = MemInitialState();

export default function DHFeedbacks() {
  console.log("MOUNTED");
  const [isOpen, setOpen] = useState(true);
  const [state, setState] = useState(() => {
    try {
      const value = localStorage.getItem(localStorageKey);
      if (value !== null) {
        return JSON.parse(value);
      } else {
        return InitialNewState();
      }
    } catch (e) {
      return InitialNewState();
    }
  });

  const icon = isOpen ? "chevron-down" : "chevron-right";

  const handleChange: React.FormEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement;
    const newState = {
      ...EmptyState(),
      [target.name]: target.checked,
    };
    setState(newState);
    localStorage.setItem(localStorageKey, JSON.stringify(newState));
    EventEmitter.emit("feedback_change", newState);
  };

  useEffect(() => {
    EventEmitter.emit("feedback_change", state);
  }, []);

  return (
    <Container>
      <ContainerTitle onClick={() => setOpen(!isOpen)}>
        <span className="title">DH Feedbacks</span>
        <Icon icon={icon} />
      </ContainerTitle>
      {isOpen ? (
        <Collapse>
          {FeedBacks.map((feedback) => {
            return (
              <Radio
                checked={state[feedback.key]}
                key={feedback.key}
                label={feedback.label}
                name={feedback.key}
                onChange={handleChange}
              />
            );
          })}
        </Collapse>
      ) : null}
    </Container>
  );
}
