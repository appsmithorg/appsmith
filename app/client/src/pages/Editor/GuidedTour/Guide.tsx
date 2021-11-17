import Button from "components/ads/Button";
import { Classes } from "components/ads/common";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { get, set } from "lodash";
import React, { ReactNode, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getCurrentStep,
  getGuidedTourDatasource,
  getGuidedTourQuery,
  getQueryAction,
  getQueryName,
  inGuidedTour,
  isExploring,
  isQueryExecutionSuccessful,
  isQueryLimitUpdated,
  loading,
} from "selectors/onboardingSelectors";
import { useSelector } from "store";
import styled from "styled-components";

const Wrapper = styled.div`
  display: inline-flex;
  gap: 2px;
  height: 5px;
  width: 100%;
`;

const ProgressBar = styled.div<{ done: boolean }>`
  flex: 1;
  height: 100%;
  background-color: #e8e8e8;
  background: linear-gradient(to left, #e8e8e8 50%, #f86a2b 50%) right;
  background-size: 200% 100%;
  transition: 0.2s ease-out;

  ${(props) => props.done && `background-position: left`}
`;

const GuideWrapper = styled.div`
  margin-top: 17px;
  margin-left: 36px;
  margin-right: 36px;

  &.query-page {
    margin-left: 20px;
    margin-right: 20px;
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border: 1px solid #f0f0f0;
  border-top-width: 0px;
  box-shadow: 0px 0px 16px -4px rgba(16, 24, 40, 0.1),
    0px 0px 6px -2px rgba(16, 24, 40, 0.05);
  flex-direction: column;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.24px;
  line-height: 20px;
  color: #000000;
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 16px;
  line-height: 19px;
  letter-spacing: -0.24px;
  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0px")};
  margin-top: 13px;
  flex: 1;
  display: flex;
`;

const UpperContent = styled.div`
  padding: 19px 24px 16px 15px;
  flex-direction: column;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 50px;
  align-items: center;

  button {
    min-width: 120px;
    padding: 11px 0px;
  }
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const IconWrapper = styled.div`
  background-color: #ffffff;
  padding: 8px;
  border-radius: 4px;
`;

const Hint = styled.div`
  background-color: #feede5;
  padding: 17px 15px;
  display: flex;
  align-items: center;
  margin-top: 18px;

  .hint-text {
    padding-left: 15px;
    font-size: 16px;
    line-height: 19px;
  }
`;

function StatusBar(props: any) {
  return (
    <Wrapper>
      <ProgressBar done={props.currentStep > 1} />
      <ProgressBar done={props.currentStep > 2} />
      <ProgressBar done={props.currentStep > 3} />
      <ProgressBar done={props.currentStep > 4} />
      <ProgressBar done={props.currentStep > 5} />
      <ProgressBar done={props.currentStep > 6} />
      <ProgressBar done={props.currentStep > 7} />
    </Wrapper>
  );
}

type Step = {
  title: string;
  description?: string;
  hint: {
    icon: IconName;
    text: ReactNode;
  };
};
type StepsType = Record<number, Step>;
const Steps: StepsType = {
  1: {
    title: `1. First is Data, Edit & Run the <query> query below to fetch customers data`,
    hint: {
      icon: "edit-box-line",
      text: (
        <>
          Edit the <b>limit</b> {"100"} with {"10"} and then Hit <b>Run</b>{" "}
          button to see response
        </>
      ),
    },
  },
  2: {
    title: "2. Go to the table to connect data",
    hint: {
      icon: "edit-box-line",
      text: (
        <>
          <b>Click on the table</b> on the left entity pane
        </>
      ),
    },
  },
};

function InitialContent() {
  const dispatch = useDispatch();
  const isLoading = useSelector(loading);

  const setupFirstStep = () => {
    dispatch({
      type: "TOGGLE_LOADER",
      payload: true,
    });
    dispatch({
      type: "CREATE_ONBOARDING_TABLE_WIDGET",
      payload: {
        type: "TABLE_WIDGET",
      },
    });
    dispatch({
      type: "CREATE_GUIDED_TOUR_QUERY",
    });
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Title>Let’s Build a Customer Support App</Title>
          <Description>
            Below is the customer support app that we will end up building
            through this welcome tour. Check it out and play with it before we
            start the tour.
          </Description>
        </SubContentWrapper>
        <Button
          isLoading={isLoading}
          onClick={setupFirstStep}
          tag="button"
          text="Start Building"
        />
      </ContentWrapper>
      <Hint>
        <IconWrapper>
          <Icon
            fillColor="#F86A2B"
            name="database-2-line"
            size={IconSize.XXL}
          />
        </IconWrapper>
        <span className="hint-text">
          Don’t worry about the Database, We got you. The app is connected to
          Mock DB by default.
        </span>
      </Hint>
    </div>
  );
}

function replacePlaceholders(
  step: number,
  fields: string[],
  substitutionMap: Record<string, string>,
) {
  const stepContent = { ...Steps[step] };
  const re = new RegExp(Object.keys(substitutionMap).join("|"), "gi");

  fields.map((field: string) => {
    let str = get(stepContent, field);
    if (str && typeof str === "string") {
      str = str.replace(re, function(matched) {
        return substitutionMap[matched];
      });

      set(stepContent, field, str);
    }
  });

  return stepContent;
}

function useUpdateName(step: number): Step {
  const queryName = useSelector(getQueryName);

  const substitutionMap = {
    "<query>": queryName,
  };

  return replacePlaceholders(step, ["title"], substitutionMap);
}

function useComputeCurrentStep() {
  let step = 1;
  const dispatch = useDispatch();
  const datasource = useSelector(getGuidedTourDatasource);
  const query = useSelector(getQueryAction);
  const queryLimitUpdated = useSelector(isQueryLimitUpdated);
  const queryExecutedSuccessfully = useSelector(isQueryExecutionSuccessful);
  step = 1;

  if (step === 1) {
    if (queryExecutedSuccessfully) {
      step = 2;
    }
  }

  if (step === 2) {
  }

  if (step === 3) {
  }

  useEffect(() => {
    if (datasource?.id) {
      dispatch({
        type: "SET_DATASOURCE_ID",
        payload: datasource.id,
      });
    }
  }, [datasource]);

  useEffect(() => {
    if (query) {
      dispatch({
        type: "SET_QUERY_ID",
        payload: query.config.id,
      });
    }
  }, [query]);

  useEffect(() => {
    dispatch({
      type: "SET_CURRENT_STEP",
      payload: step,
    });
  }, [step]);

  useEffect(() => {
    if (queryLimitUpdated) {
      dispatch({
        type: "SET_INDICATOR_LOCATION",
        payload: "RUN_QUERY",
      });
    } else {
      dispatch({
        type: "SET_INDICATOR_LOCATION",
        payload: undefined,
      });
    }
  }, [queryLimitUpdated]);
}

function GuideStepsContent(props: { currentStep: number }) {
  const content = useUpdateName(props.currentStep);

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Title>{content.title}</Title>
          {content.description && (
            <Description>{content.description}</Description>
          )}
        </SubContentWrapper>
      </ContentWrapper>
      <Hint>
        <IconWrapper>
          <Icon
            fillColor="#F86A2B"
            name={content.hint.icon}
            size={IconSize.XXL}
          />
        </IconWrapper>
        <span className="hint-text">{content.hint.text}</span>
      </Hint>
    </div>
  );
}

type GuideProps = {
  className?: string;
};
// Guided tour steps
function Guide(props: GuideProps) {
  const exploring = useSelector(isExploring);
  useComputeCurrentStep();
  const step = useSelector(getCurrentStep);

  return (
    <GuideWrapper className={props.className}>
      <CardWrapper>
        <StatusBar currentStep={step} totalSteps={6} />
        <UpperContent>
          {exploring ? (
            <InitialContent />
          ) : (
            <GuideStepsContent currentStep={step} />
          )}
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
