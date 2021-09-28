import { getDocViewerConfigs } from "widgets/DocumentViewerWidget/component";

describe("validate document viewer url", () => {
  it("validate correct config should return for extension based urls", () => {
    const input = [
      "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.docx",
      "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.odt",
      "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.rtf",
      "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.pdf",
      "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.txt",
    ];

    const expected = [
      {
        url:
          "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.docx",
        viewer: "office",
        errorMessage: "",
      },
      {
        url:
          "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.odt",
        viewer: "url",
        errorMessage: "Current file type is not supported",
      },
      {
        url:
          "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.rtf",
        viewer: "url",
        errorMessage: "Current file type is not supported",
      },
      {
        url:
          "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.pdf",
        viewer: "url",
        errorMessage: "",
      },
      {
        url:
          "https://roteemealplancover.s3.ap-south-1.amazonaws.com/sample/Project+proposal.txt",
        viewer: "url",
        errorMessage: "",
      },
    ];

    for (let index = 0; index < input.length; index++) {
      const result = getDocViewerConfigs(input[index]);
      expect(result).toStrictEqual(expected[index]);
    }
  });

  it("validate errorMessage should return for empty url", () => {
    const input = "";
    const result = getDocViewerConfigs(input);
    expect(result).toStrictEqual({
      url: "",
      viewer: "url",
      errorMessage: "No document url provided for viewer",
    });
  });
});
