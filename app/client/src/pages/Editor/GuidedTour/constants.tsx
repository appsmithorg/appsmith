import React from "react";
import { ReactNode } from "react";
import { Dispatch } from "redux";
import styled from "styled-components";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import TableData from "assets/gifs/table_data.gif";
import DefaultText from "assets/gifs/default_text.gif";
import { setCurrentStep, addOnboardingWidget } from "actions/onboardingActions";
import { IconName } from "components/ads/Icon";
import { highlightSection } from "./utils";

export const onboardingContainerBlueprint = {
  view: [
    {
      type: "CANVAS_WIDGET",
      position: { top: 0, left: 0 },
      props: {
        containerStyle: "none",
        canExtend: false,
        detachFromLayout: true,
        children: [],
        version: 1,
        blueprint: {
          view: [
            {
              type: "TEXT_WIDGET",
              size: {
                rows: 1 * GRID_DENSITY_MIGRATION_V1,
                cols: 8 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 0,
                left: 0,
              },
              props: {
                text: "🧑‍🦱 Customer Update Form",
                version: 1,
                fontStyle: "BOLD",
              },
            },
            {
              type: "IMAGE_WIDGET",
              size: {
                rows: 4 * GRID_DENSITY_MIGRATION_V1,
                cols: 6 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 1.5 * GRID_DENSITY_MIGRATION_V1,
                left: 0 * GRID_DENSITY_MIGRATION_V1,
              },
              props: {
                version: 1,
                objectFit: "cover",
              },
            },
            {
              type: "INPUT_WIDGET",
              size: {
                rows: 1 * GRID_DENSITY_MIGRATION_V1,
                cols: 9.1 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 2 * GRID_DENSITY_MIGRATION_V1,
                left: 6.9 * GRID_DENSITY_MIGRATION_V1,
              },
              props: {
                label: "Name",
                version: 1,
                labelStyle: "bold,BOLD",
              },
            },
            {
              type: "INPUT_WIDGET",
              size: {
                rows: 1 * GRID_DENSITY_MIGRATION_V1,
                cols: 9 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 3.5 * GRID_DENSITY_MIGRATION_V1,
                left: 7 * GRID_DENSITY_MIGRATION_V1,
              },
              props: {
                label: "Email",
                version: 1,
                labelStyle: "bold,BOLD",
              },
            },
            {
              type: "INPUT_WIDGET",
              size: {
                rows: 1 * GRID_DENSITY_MIGRATION_V1,
                cols: 9.6 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 5 * GRID_DENSITY_MIGRATION_V1,
                left: 6.3 * GRID_DENSITY_MIGRATION_V1,
              },
              props: {
                label: "Country",
                version: 1,
                labelStyle: "bold,BOLD",
              },
            },
          ],
        },
      },
    },
  ],
};

type Step = {
  title: string;
  description?: string;
  elementSelector?: string;
  hints: {
    text: ReactNode;
    image?: string;
    button?: {
      text: string;
    };
    steps?: ReactNode[];
  }[];
  success?: {
    text: string;
    onClick?: (dispatch: Dispatch<any>) => void;
    timed?: boolean;
  };
  info?: {
    icon: IconName;
    text: ReactNode;
    onClick: (dispatch: Dispatch<any>) => void;
  };
};
type StepsType = Record<number, Step>;

const RunButton = styled.div`
  background-color: #f86a2b;
  padding: 5px 15px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
`;

export const Steps: StepsType = {
  1: {
    title: `First step is querying the database. Here we are querying a Postgres database populated with customers data.`,
    elementSelector: "query-table-response",
    hints: [
      {
        text: (
          <>
            <b>Edit</b> the getCustomers query below to fetch data. Replace the{" "}
            <b>limit</b> {`"20"`} with {`"10"`}.
          </>
        ),
      },
      {
        text: (
          <>
            Now hit the <RunButton>RUN</RunButton> button to see the response.
          </>
        ),
      },
    ],
    success: {
      text:
        "Excellent! You successfully queried the database and you can see the response of the query below. ",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(2));
      },
    },
  },
  2: {
    title:
      "Let’s display this response in a table. Select the table widget we’ve added for you.",
    hints: [
      {
        text: (
          <>
            <b>Click on the CustomersTable widget</b> in the explorer on the
            left.
          </>
        ),
      },
    ],
  },
  3: {
    title: "Display the response of the query in a table.",
    hints: [
      {
        text: (
          <>
            Bind the response by typing{" "}
            <b>
              &#123;&#123;
              {"getCustomers.data"}&#125;&#125;
            </b>{" "}
            in the Table Data input field on the right pane.
          </>
        ),
        image: TableData,
      },
    ],
    success: {
      text:
        "Great job! The table is now displaying the response of a query. You can use {{ }} in any input field to bind data to widgets.",
      onClick: () => highlightSection("property-pane"),
      timed: true,
    },
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          The pane on the right is called the <b>Property Pane</b>. Here you can
          modify properties, data, or styling for every widget.
        </>
      ),
      onClick: (dispatch) => {
        dispatch(setCurrentStep(4));
        dispatch(
          addOnboardingWidget({
            type: "CONTAINER_WIDGET",
            widgetName: "CustomersInfo",
            props: {
              blueprint: onboardingContainerBlueprint,
            },
            bottomRow: 100,
            rightColumn: 64,
            columns: 30,
            leftColumn: 34,
            topRow: 7,
            parentColumnSpace: 18,
            parentRowSpace: 0,
          }),
        );
      },
    },
  },
  4: {
    title: "Let’s build a form to update a customer record ",
    hints: [
      {
        text: (
          <>
            We{"'"}ll{" "}
            <b>
              display the data from a table{"'"}s selected row inside an input
              field.
            </b>
            <br /> This will let us see the data before we update it.
          </>
        ),
        button: {
          text: "PROCEED TO NEXT STEP",
        },
        // Get gif from url
        image: DefaultText,
      },
      {
        text: (
          <>
            In the property pane of Name input, add the{" "}
            <b>&#123;&#123;CustomersTable.selectedRow.name&#125;&#125;</b>{" "}
            binding to the <b>Default Text</b> property
          </>
        ),
      },
    ],
    success: {
      text:
        "Awesome! You connected the input widget to table’s selected row. The input will always show the data from the selected row.",
      timed: true,
      onClick: (dispatch) => {
        dispatch(setCurrentStep(5));
      },
    },
  },
  5: {
    title:
      "Connect all input fields in the Customer Update Form with the table",
    hints: [
      {
        text: (
          <>
            Now let{"'"}s connect rest of widgets in the container to Table{"'"}
            s selected row
          </>
        ),
        steps: [
          <>
            Connect <b>{`"Email Input"`}</b>
            {"'"}s Default Text Property to
            &#123;&#123;CustomersTable.selectedRow.email&#125;&#125;
          </>,
          <>
            Connect <b>{`"Country Input"`}</b>
            {"'"}s Default Text Property to
            &#123;&#123;CustomersTable.selectedRow.country&#125;&#125;
          </>,
          <>
            Connect <b>{`"Display Image"`}</b>
            {"'"}s Image Property to
            &#123;&#123;CustomersTable.selectedRow.image&#125;&#125;
          </>,
        ],
      },
    ],
    success: {
      text:
        "Great work! All inputs are now connected to the  table’s selected row",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(6));
      },
    },
  },
  6: {
    title: "Add an update button to trigger an update query",
    hints: [
      {
        text: (
          <>
            Switch to the widget pane and then <b>Drag {"&"} Drop</b> a{" "}
            <b>Button</b> widget into the left bottom of container, below the
            image. Update the label of the button to <i>Update info</i>
          </>
        ),
      },
    ],
    success: {
      text: "Perfect! Your update button is ready to trigger an update query.",
      timed: true,
    },
    info: {
      icon: "lightbulb-flash-line",
      text: (
        <>
          To <b>update the customers</b> through the button, we created an{" "}
          <b>updateCustomerInfo query</b> for you which is ready to use
        </>
      ),
      onClick: (dispatch) => {
        dispatch(setCurrentStep(7));
      },
    },
  },
  7: {
    title: "Trigger updateCustomerInfo query by binding to the button widget",
    hints: [
      {
        text: (
          <>
            Select the button widget to see the properties in the propety pane.
            From the onClick dropdown, select <b>Execute a query</b> {"&"} then
            select <b>updateCustomerInfo</b> query
          </>
        ),
      },
    ],
  },
  8: {
    title:
      "After successfully triggering the update query, fetch the updated customer data. ",
    hints: [
      {
        text: (
          <>
            Click the onSuccess dropdown, select <b>Execute a query</b> {"&"}{" "}
            then choose <b>getCustomers</b> Query
          </>
        ),
      },
    ],
    success: {
      text:
        "Exceptional work! You’ve now built a way to see customer data and update it.",
      onClick: (dispatch) => {
        dispatch(setCurrentStep(9));
      },
    },
  },
  9: {
    title: "Final step: Test & deploy your app",
    hints: [
      {
        text: (
          <>
            Test your app and ensure there are no errors. When you are ready,
            click <b>Deploy</b> to deploy this app to a URL.
          </>
        ),
      },
    ],
  },
};
