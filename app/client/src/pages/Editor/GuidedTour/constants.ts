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
              type: "INPUT_WIDGET",
              size: {
                rows: 1 * GRID_DENSITY_MIGRATION_V1,
                cols: 8 * GRID_DENSITY_MIGRATION_V1,
              },
              position: {
                top: 0 * GRID_DENSITY_MIGRATION_V1,
                left: 0 * GRID_DENSITY_MIGRATION_V1,
              },
              props: {
                label: "Customer Name",
                version: 1,
              },
            },
          ],
        },
      },
    },
  ],
};
