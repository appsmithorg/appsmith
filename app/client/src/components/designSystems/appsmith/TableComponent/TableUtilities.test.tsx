import { renderCell } from "./TableUtilities";
import { ColumnTypes } from "components/designSystems/appsmith/TableComponent/Constants";

describe("Test table columnType Image render", () => {
  it("columnType Image accepts single image url and renders image correctly", () => {
    const value =
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg";

    const expected = [
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg",
    ];
    const ImageCellComponent = renderCell(
      value,
      ColumnTypes.IMAGE,
      false,
      {},
      930,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.href;
    });

    expect(expected).toEqual(result);
  });

  it("columnType Image accepts single base64 url and renders image correctly", () => {
    const value =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

    const expected = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
    ];
    const ImageCellComponent = renderCell(
      value,
      ColumnTypes.IMAGE,
      false,
      {},
      930,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.href;
    });

    expect(expected).toEqual(result);
  });

  it("columnType Image accepts comma separeted image urls and renders all images correctly", () => {
    const value =
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg,http://commondatastorage.googleapis.com/codeskulptor-assets/gutenberg.jpg,http://commondatastorage.googleapis.com/codeskulptor-assets/gutenberg.jpg";

    const expected = [
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg",
      "http://commondatastorage.googleapis.com/codeskulptor-assets/gutenberg.jpg",
      "http://commondatastorage.googleapis.com/codeskulptor-assets/gutenberg.jpg",
    ];
    const ImageCellComponent = renderCell(
      value,
      ColumnTypes.IMAGE,
      false,
      {},
      930,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.href;
    });

    expect(expected).toEqual(result);
  });

  it("columnType Image accepts comma separeted image urls that has base64 image and renders images correctly", () => {
    const value =
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg,data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

    const expected = [
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
    ];
    const ImageCellComponent = renderCell(
      value,
      ColumnTypes.IMAGE,
      false,
      {},
      930,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.href;
    });

    expect(expected).toEqual(result);
  });

  it("columnType Image accepts image url that may have incorrect use of comma and renders image correctly", () => {
    const value =
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg, ";

    const expected = [
      "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/back02.jpg",
      undefined,
    ];
    const ImageCellComponent = renderCell(
      value,
      ColumnTypes.IMAGE,
      false,
      {},
      930,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.href;
    });

    expect(expected).toEqual(result);
  });
});
