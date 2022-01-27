import { renderCell } from "./TableUtilities";
import { ColumnTypes } from "widgets/TableWidget/component/Constants";

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
      { isCellVisible: true },
      930,
      true,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.children.props.style.backgroundImage
        .slice(4, -1)
        .replace(/"/g, "");
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
      { isCellVisible: true },
      930,
      true,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.children.props.style.backgroundImage
        .slice(4, -1)
        .replace(/"/g, "");
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
      { isCellVisible: true },
      930,
      true,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.children.props.style.backgroundImage
        .slice(4, -1)
        .replace(/"/g, "");
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
      { isCellVisible: true },
      930,
      true,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      return imageDiv.props.children.props.style.backgroundImage
        .slice(4, -1)
        .replace(/"/g, "");
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
      { isCellVisible: true },
      930,
      true,
    );
    const result = ImageCellComponent.props.children.map((imageDiv: any) => {
      // check and get img url if exist
      const imageDivProps = imageDiv.props.children.props;
      if (imageDivProps) {
        return imageDivProps.style.backgroundImage
          .slice(4, -1)
          .replace(/"/g, "");
      } else {
        return undefined;
      }
    });

    expect(expected).toEqual(result);
  });

  it("columnType Text accepts undefined value and render empty string ", () => {
    const value = undefined;
    const expected = "";
    const renderedCell = renderCell(
      value,
      ColumnTypes.TEXT,
      false,
      { isCellVisible: true },
      930,
      true,
    );

    expect(expected).toEqual(renderedCell.props.children);
  });

  it("columnType Text accepts null value and render empty string ", () => {
    const value = null;
    const expected = "";
    const renderedCell = renderCell(
      value,
      ColumnTypes.TEXT,
      false,
      { isCellVisible: true },
      930,
      true,
    );

    expect(expected).toEqual(renderedCell.props.children);
  });

  it("columnType Number accepts 0 as value and renders 0 ", () => {
    const value = 0;
    const expected = "0";
    const renderedCell = renderCell(
      value,
      ColumnTypes.NUMBER,
      false,
      { isCellVisible: true },
      930,
      true,
    );

    expect(expected).toEqual(renderedCell.props.children);
  });

  it("columnType Number accepts NaN as value and renders empty string ", () => {
    const value = NaN;
    const expected = "";
    const renderedCell = renderCell(
      value,
      ColumnTypes.NUMBER,
      false,
      { isCellVisible: true },
      930,
      true,
    );

    expect(expected).toEqual(renderedCell.props.children);
  });
});
