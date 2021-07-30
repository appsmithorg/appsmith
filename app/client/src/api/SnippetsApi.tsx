import { AxiosPromise } from "axios";
import { reject } from "lodash";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

type SnippetsRequest = {
  entity: [string];
  field: [string];
  dataType: string;
  query: string;
};

const dummyResponse = [
  {
    title: "Concat Array",
    description: "Merge data from two entities into a single entity",
    snippet: "{{ arr1.concat(arr2) }}",
    args: [{}],
    returnType: "Array",
    examples: [
      {
        title: "The following is how you would use this method",
        code:
          "const first = api.data;\nconst second = api.data;\nconsole.log(first.concat(second));",
        summary: "",
      },
    ],
  },
  {
    title: "Data merge",
    description: "",
    snippet: "arr1.concat(arr2)",
    args: [{}],
    returnType: "Array",
    examples: [
      {
        title: "",
        code: "",
        summary: "",
      },
    ],
  },
  {
    title: "Data merge",
    description: "",
    snippet: "arr1.concat(arr2)",
    args: [{}],
    returnType: "Array",
    examples: [
      {
        title: "",
        code: "",
        summary: "",
      },
    ],
  },
];

class SnippetsApi extends Api {
  static baseURL = "v1/snippets";
  static getSnippetsURL = `${SnippetsApi.baseURL}/dummy`;

  static getSnippets(
    requestParams: any, //SnippetsRequest,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({
        data: dummyResponse,
        responseMeta: {},
      });
    }); //Api.get(SnippetsApi.getSnippetsURL, requestParams);
  }
}

export default SnippetsApi;
