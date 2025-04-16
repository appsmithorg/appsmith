import * as echarts from "echarts";
import countryDetails from "./countryDetails";
import { MapTypes } from "../constants";
import { geoAlbers, geoAzimuthalEqualArea, geoMercator } from "d3-geo";
import log from "loglevel";
import captureException from "instrumentation/sendFaroErrors";
import { retryPromise } from "utils/AppsmithUtils";

interface GeoSpecialAreas {
  [areaName: string]: {
    left: number;
    top: number;
    width?: number;
    height?: number;
  };
}

export function getSpecialAreas(map: MapTypes): GeoSpecialAreas {
  switch (map) {
    case MapTypes.USA:
      return {
        AK: {
          left: -131,
          top: 25,
          width: 15,
        },
        HI: {
          left: -110,
          top: 25,
          width: 5,
        },
        PR: {
          left: -76,
          top: 26,
          width: 2,
        },
      };
    default:
      return {};
  }
}

/*
 * Function to load the map geojson file and register it with echarts
 */
export const loadMapGenerator = () => {
  let abortController: AbortController | null = null;

  return async (type: MapTypes) => {
    if (!echarts.getMap(type)) {
      if (abortController && abortController.abort) {
        abortController.abort();
      }

      if (AbortController) {
        abortController = new AbortController();
      }

      return retryPromise(
        async () => {
          return fetch(`/static/maps/${type}.json`, {
            signal: abortController?.signal,
          });
        },
        3,
        0,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error: any) => error.code !== 20,
      )
        .then(
          (response) => response.json(),
          (error) => {
            abortController = null;

            if (error.code !== 20) {
              log.error({ error });
              captureException(error, {
                errorName: "MapChartWidget_utilities",
              });
            }
          },
        )
        .then((geoJson) => {
          abortController = null;
          echarts.registerMap(type, geoJson, getSpecialAreas(type));
        });
    } else {
      return Promise.resolve();
    }
  };
};

function getProjection(type: string) {
  switch (type) {
    case "OCEANIA":
      return geoAzimuthalEqualArea()
        .scale(242)
        .center([22, -39])
        .translate([480, 319])
        .rotate([-165, 18, 0]);
    case "ASIA":
      return geoAzimuthalEqualArea()
        .scale(400)
        .center([-17, -26])
        .translate([480, 303])
        .rotate([-103, -55, 7]);
    case "AFRICA":
      return geoMercator()
        .scale(278)
        .center([110, 4])
        .translate([936, 288])
        .rotate([180, 180, 180]);
    case "SOURTH_AMERICA":
      return geoAlbers()
        .scale(363)
        .center([-15, 24])
        .translate([450, 271])
        .rotate([51, 55, 9]);
    case "NORTH_AMERICA":
      return geoAzimuthalEqualArea()
        .scale(400)
        .center([13, 25])
        .translate([539, 415])
        .rotate([-84, 174, -180]);
  }
}

export function getPositionOffset(
  type: MapTypes,
  width: number,
  height: number,
) {
  switch (type) {
    case MapTypes.SOURTH_AMERICA:
    case MapTypes.NORTH_AMERICA:
    case MapTypes.AFRICA:
      return {
        layoutSize: Math.min(width, height - 130),
        layoutCenter: ["50%", height / 2 + 30],
      };
    case MapTypes.ASIA:
      return {
        layoutSize: Math.min(width, height - 65),
        layoutCenter: ["50%", height / 2 + 30],
      };
    case MapTypes.EUROPE:
    case MapTypes.USA:
      return {
        layoutSize: Math.min(width, height),
        layoutCenter: ["50%", height / 2 + 30],
      };
    case MapTypes.WORLD:
    case MapTypes.WORLD_WITH_ANTARCTICA:
      return {
        layoutSize: Math.min(width, height),
        layoutCenter: ["50%", height / 2 + 40],
      };
    default:
      return {};
  }
}

export const getChartOption = (
  caption: string,
  showLabel: boolean,
  colorRangePieces: {
    min: number;
    max: number;
    color: string;
  }[],
  data: { name: string; value: number }[],
  type: MapTypes,
  height: number,
  width: number,
  fontFamily?: string,
) => {
  const projection = getProjection(type);

  let projectionConfig = {};

  if (projection) {
    projectionConfig = {
      projection: {
        project: (point: [number, number]) => projection(point),
        unproject: (point: [number, number]) => projection.invert?.(point),
        stream: projection.stream,
      },
    };
  }

  return {
    title: {
      text: caption,
      left: "center",
      top: "12px",
      textStyle: {
        fontSize: 24,
        fontWeight: "bold",
        fontFamily,
      },
    },
    tooltip: {
      trigger: "item",
      showDelay: 0,
      transitionDuration: 0.2,
    },
    visualMap: {
      show: true,
      type: "piecewise",
      pieces: colorRangePieces,
      formatter: (min: number, max: number) => {
        return `${min}-${max}`;
      },
      orient: "horizontal",
      top: "68px",
      left: "center",
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 14,
        color: "#4c5664",
        overflow: "break",
      },
      itemSymbol: "rect",
    },
    toolbox: {
      show: false,
    },
    series: [
      {
        type: "map",
        ...getPositionOffset(type, width, height),
        roam: true,
        map: type,
        itemStyle: {
          borderColor: "#ccc",
          areaColor: "#aeaeae",
        },
        emphasis: {
          itemStyle: {
            areaColor: "#FFF9C4",
          },
        },
        tooltip: {
          show: true,
          borderColor: "#ccc",
          padding: [4, 8],
          fontFamily,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (d: any) => {
            const key = d?.name as string;
            const label = countryDetails[type][key]?.["label"];

            return `${label}, ${d.data?.value || "-"}`;
          },
          textStyle: {
            fontSize: 14,
            color: "#4c5664",
          },
          extraCssText: "border-radius: 0;",
        },
        label: {
          show: showLabel,
          fontFamily,
          position: "top",
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (d: any) => {
            const key = d?.name as string;
            const label = countryDetails[type][key]["short_label"];

            return `${label}: ${d.data?.value || "-"}`;
          },
          textStyle: {
            fontSize: 12,
            color: "#4c5664",
          },
        },
        scaleLimit: {
          min: 1,
          max: 4,
        },
        labelLayout: () => {
          return {
            hideOverlap: true,
          };
        },
        nameProperty: "id",
        data,
        ...projectionConfig,
      },
    ],
  };
};
