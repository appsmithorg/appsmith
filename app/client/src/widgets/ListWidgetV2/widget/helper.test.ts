import type { FlattenedWidgetProps } from "widgets/constants";
import {
  getNumberOfChildListWidget,
  getNumberOfParentListWidget,
} from "./helper";

const widgets = {
  "0": {
    widgetId: "0",
    type: undefined,
    parentId: undefined,
    children: ["139ik5upi0", "3oplcuqz12"],
  },
  "3oplcuqz12": {
    widgetId: "3oplcuqz12",
    type: "LIST_WIDGET_V2",
    parentId: "0",
    children: ["69jgkaa2eu"],
  },
  "69jgkaa2eu": {
    widgetId: "69jgkaa2eu",
    type: "CANVAS_WIDGET",
    parentId: "3oplcuqz12",
    children: ["a7ee6ec9iu"],
  },
  a7ee6ec9iu: {
    widgetId: "a7ee6ec9iu",
    type: "CONTAINER_WIDGET",
    parentId: "69jgkaa2eu",
    children: ["hlb038yavj"],
  },
  hlb038yavj: {
    widgetId: "hlb038yavj",
    type: "CANVAS_WIDGET",
    parentId: "a7ee6ec9iu",
    children: ["2s2tpbx8sm"],
  },
  "2s2tpbx8sm": {
    widgetId: "2s2tpbx8sm",
    type: "LIST_WIDGET_V2",
    parentId: "hlb038yavj",
    children: ["cx176bx3re"],
  },
  cx176bx3re: {
    widgetId: "cx176bx3re",
    type: "CANVAS_WIDGET",
    parentId: "2s2tpbx8sm",
    children: ["30yh4juxkl"],
  },
  "30yh4juxkl": {
    widgetId: "30yh4juxkl",
    type: "CONTAINER_WIDGET",
    parentId: "cx176bx3re",
    children: ["m2rv93a8qt"],
  },
  m2rv93a8qt: {
    widgetId: "m2rv93a8qt",
    type: "CANVAS_WIDGET",
    parentId: "30yh4juxkl",
    children: ["iz7xsw9rwx"],
  },
  iz7xsw9rwx: {
    widgetId: "iz7xsw9rwx",
    type: "CONTAINER_WIDGET",
    parentId: "m2rv93a8qt",
    children: ["fmgpap28mr"],
  },
  fmgpap28mr: {
    widgetId: "fmgpap28mr",
    type: "CANVAS_WIDGET",
    parentId: "iz7xsw9rwx",
    children: ["e3spa0gb41"],
  },
  e3spa0gb41: {
    widgetId: "e3spa0gb41",
    type: "LIST_WIDGET_V2",
    parentId: "fmgpap28mr",
    children: ["yntrlyu08l"],
  },
  yntrlyu08l: {
    widgetId: "yntrlyu08l",
    type: "CANVAS_WIDGET",
    parentId: "e3spa0gb41",
    children: ["7kpy7wguuv"],
  },
  "7kpy7wguuv": {
    widgetId: "7kpy7wguuv",
    type: "CONTAINER_WIDGET",
    parentId: "yntrlyu08l",
    children: ["lra8uwgwtk"],
  },
  lra8uwgwtk: {
    widgetId: "lra8uwgwtk",
    type: "CANVAS_WIDGET",
    parentId: "7kpy7wguuv",
    children: [],
  },
  "139ik5upi0": {
    widgetId: "139ik5upi0",
    type: "LIST_WIDGET_V2",
    parentId: "0",
    children: ["5oqysabeac"],
  },
  "5oqysabeac": {
    widgetId: "5oqysabeac",
    type: "CANVAS_WIDGET",
    parentId: "139ik5upi0",
    children: ["mkxlp9tm5r"],
  },
  mkxlp9tm5r: {
    widgetId: "mkxlp9tm5r",
    type: "CONTAINER_WIDGET",
    parentId: "5oqysabeac",
    children: ["4rdfztkqm7"],
  },
  "4rdfztkqm7": {
    widgetId: "4rdfztkqm7",
    type: "CANVAS_WIDGET",
    parentId: "mkxlp9tm5r",
    children: ["qjiycy9cia"],
  },
  qjiycy9cia: {
    widgetId: "qjiycy9cia",
    type: "CONTAINER_WIDGET",
    parentId: "4rdfztkqm7",
    children: ["3917oy1o62"],
  },
  "3917oy1o62": {
    widgetId: "3917oy1o62",
    type: "CANVAS_WIDGET",
    parentId: "qjiycy9cia",
    children: ["9fjkqovvbf"],
  },
  "9fjkqovvbf": {
    widgetId: "9fjkqovvbf",
    type: "LIST_WIDGET_V2",
    parentId: "3917oy1o62",
    children: ["v3y02o9gde"],
  },
  v3y02o9gde: {
    widgetId: "v3y02o9gde",
    type: "CANVAS_WIDGET",
    parentId: "9fjkqovvbf",
    children: ["okws6qxk8e"],
  },
  okws6qxk8e: {
    widgetId: "okws6qxk8e",
    type: "CONTAINER_WIDGET",
    parentId: "v3y02o9gde",
    children: ["12fp6p9vkn"],
  },
  "12fp6p9vkn": {
    widgetId: "12fp6p9vkn",
    type: "CANVAS_WIDGET",
    parentId: "okws6qxk8e",
    children: [],
  },
} as unknown as { [widgetId: string]: FlattenedWidgetProps };

describe("Helper functions", () => {
  it("1.getNumberOfChildListWidget", () => {
    expect(getNumberOfChildListWidget("139ik5upi0", widgets)).toEqual(2);
  });

  it("2.getNumberOfParentListWidget", () => {
    expect(getNumberOfParentListWidget("lra8uwgwtk", widgets)).toEqual(3);
  });
});
