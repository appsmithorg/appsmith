import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

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
