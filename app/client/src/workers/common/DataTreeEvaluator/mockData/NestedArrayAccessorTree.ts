import { PluginType, PaginationType } from "entities/Action";
import type {
  WidgetEntity,
  WidgetEntityConfig,
  ActionEntityConfig,
  ActionEntity,
} from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import {
  EvaluationSubstitutionType,
  ENTITY_TYPE,
} from "ee/entities/DataTree/types";

export const nestedArrayAccessorCyclicDependency: Record<string, DataTree> = {
  initUnEvalTree: {
    Api1: {
      run: {},
      clear: {},
      actionId: "6285d928db0f9c6e620d454a",
      config: {
        timeoutInMillisecond: 10000,
        paginationType: PaginationType.NONE,
        path: "/posts",
        queryParameters: [
          {
            key: "",
            value: "",
          },
          {
            key: "",
            value: "",
          },
        ],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      responseMeta: {
        isExecutionSuccess: false,
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      isLoading: false,
      datasourceUrl: "https://jsonplaceholder.typicode.com",
    } as unknown as ActionEntity,
    Text1: {
      widgetName: "Text1",
      displayName: "Text",
      iconSVG: "/static/media/icon.97c59b52.svg",
      topRow: 14,
      bottomRow: 18,
      parentRowSpace: 10,
      type: "TEXT_WIDGET",
      hideCard: false,
      animateLoading: true,
      overflow: "NONE",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 11.796875,
      leftColumn: 21,
      shouldTruncate: false,
      truncateButtonColor: "#FFC13D",
      text: "{{\nApi1.data[2][2].id\n}}",
      key: "ljtoov0cml",
      rightColumn: 37,
      textAlign: "LEFT",
      widgetId: "1p9hcl50i8",
      isVisible: true,
      fontStyle: "BOLD",
      textColor: "#231F20",
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      fontSize: "1rem",
      value: "{{ Text1.text }}",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      meta: {},
    } as unknown as WidgetEntity,
  },
  apiSuccessUnEvalTree: {
    // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
    Api1: {
      run: {},
      clear: {},
      actionId: "6285d928db0f9c6e620d454a",
      config: {
        timeoutInMillisecond: 10000,
        paginationType: PaginationType.NONE,
        path: "/posts",
        queryParameters: [],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      data: [
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
      ],
      responseMeta: {
        statusCode: "200 OK",
        isExecutionSuccess: true,
        headers: {
          Date: ["Fri, 20 May 2022 09:18:48 GMT"],
          "Content-Type": ["application/json; charset=utf-8"],
          "Transfer-Encoding": ["chunked"],
          Connection: ["keep-alive"],
          "X-Powered-By": ["Express"],
          "X-Ratelimit-Limit": ["1000"],
          "X-Ratelimit-Remaining": ["999"],
          "X-Ratelimit-Reset": ["1652916230"],
          Vary: ["Origin, Accept-Encoding"],
          "Access-Control-Allow-Credentials": ["true"],
          "Cache-Control": ["max-age=43200"],
          Pragma: ["no-cache"],
          Expires: ["-1"],
          "X-Content-Type-Options": ["nosniff"],
          Etag: ['W/"6b80-Ybsq/K6GwwqrYkAsFxqDXGC7DoM"'],
          Via: ["1.1 vegur"],
          "CF-Cache-Status": ["HIT"],
          Age: ["6791"],
          "Expect-CT": [
            'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
          ],
          "Report-To": [
            '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=mL80WXGZevCRJ%2BH3N6Uq0dvpeHk%2BFLrmzIZMCcTnH10LlRna45sxEdLPMELrTur3z3Tr8ucgNQ7X%2FuIhNRTRj00%2FvML3zxIkOIZsrKf3iTIeQDts3oFwUg9b51xg0IDoperi1JchNq5muJETOeT%2B"}],"group":"cf-nel","max_age":604800}',
          ],
          NEL: ['{"success_fraction":0,"report_to":"cf-nel","max_age":604800}'],
          Server: ["cloudflare"],
          "CF-RAY": ["70e3fcb39dde18ce-SIN"],
          "alt-svc": ['h3=":443"; ma=86400, h3-29=":443"; ma=86400'],
          "X-APPSMITH-DATATYPE": ["JSON"],
        },
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      isLoading: false,
      datasourceUrl: "https://jsonplaceholder.typicode.com",
    },
    // Text1.text binding Api1.data[2][2].id
    Text1: {
      widgetName: "Text1",
      displayName: "Text",
      iconSVG: "/static/media/icon.97c59b52.svg",
      topRow: 14,
      bottomRow: 18,
      parentRowSpace: 10,
      type: "TEXT_WIDGET",
      hideCard: false,
      animateLoading: true,
      overflow: "NONE",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 11.796875,
      leftColumn: 21,
      shouldTruncate: false,
      truncateButtonColor: "#FFC13D",
      text: "{{\nApi1.data[2][2].id\n}}",
      key: "ljtoov0cml",
      rightColumn: 37,
      textAlign: "LEFT",
      widgetId: "1p9hcl50i8",
      isVisible: true,
      fontStyle: "BOLD",
      textColor: "#231F20",
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      fontSize: "1rem",
      value: "{{ Text1.text }}",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      meta: {},
    } as unknown as WidgetEntity,
  },
  apiFailureUnEvalTree: {
    // failure: response -> {}
    Api1: {
      run: {},
      clear: {},
      actionId: "6285d928db0f9c6e620d454a",
      config: {
        timeoutInMillisecond: 10000,
        paginationType: PaginationType.NONE,
        path: "/pos",
        queryParameters: [],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      data: {},
      responseMeta: {
        statusCode: "404 NOT_FOUND",
        isExecutionSuccess: false,
        headers: {
          Date: ["Fri, 20 May 2022 09:20:01 GMT"],
          "Content-Type": ["application/json; charset=utf-8"],
          Connection: ["keep-alive"],
          "X-Powered-By": ["Express"],
          "X-Ratelimit-Limit": ["1000"],
          "X-Ratelimit-Remaining": ["999"],
          "X-Ratelimit-Reset": ["1653038437"],
          Vary: ["Origin, Accept-Encoding"],
          "Access-Control-Allow-Credentials": ["true"],
          "Cache-Control": ["max-age=43200"],
          Pragma: ["no-cache"],
          Expires: ["-1"],
          "X-Content-Type-Options": ["nosniff"],
          Etag: ['W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"'],
          Via: ["1.1 vegur"],
          "CF-Cache-Status": ["EXPIRED"],
          "Expect-CT": [
            'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
          ],
          "Report-To": [
            '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=UkqmMMihJpG%2BIoEcVub10200FpqRPQDDipw0gOy%2B5nYRyuF6NZ4X1CoNEXk2YLHb%2FLkt%2F1rXFAJJq5xwJtRgb6%2BsXwWEAqWi5vSP5D6DMhVyP%2Fyr5Q5FQc3dfILZfmeEoCWKxlEq0AfhOOKThz%2BK"}],"group":"cf-nel","max_age":604800}',
          ],
          NEL: ['{"success_fraction":0,"report_to":"cf-nel","max_age":604800}'],
          Server: ["cloudflare"],
          "CF-RAY": ["70e3fe76b80d9f86-SIN"],
          "alt-svc": ['h3=":443"; ma=86400, h3-29=":443"; ma=86400'],
          "content-length": ["2"],
          "X-APPSMITH-DATATYPE": ["JSON"],
        },
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      isLoading: false,
      datasourceUrl: "https://jsonplaceholder.typicode.com",
    },
    // Text1.text binding Api1.data[2][2].id
    Text1: {
      widgetName: "Text1",
      displayName: "Text",
      iconSVG: "/static/media/icon.97c59b52.svg",
      topRow: 14,
      bottomRow: 18,
      parentRowSpace: 10,
      type: "TEXT_WIDGET",
      hideCard: false,
      animateLoading: true,
      overflow: "NONE",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 11.796875,
      leftColumn: 21,
      shouldTruncate: false,
      truncateButtonColor: "#FFC13D",
      text: "{{\nApi1.data[2][2].id\n}}",
      key: "ljtoov0cml",
      rightColumn: 37,
      textAlign: "LEFT",
      widgetId: "1p9hcl50i8",
      isVisible: true,
      fontStyle: "BOLD",
      textColor: "#231F20",
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      fontSize: "1rem",
      value: "{{ Text1.text }}",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      meta: {},
    } as unknown as WidgetEntity,
  },
  apiSuccessUnEvalTree2: {
    // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}] ]
    Api1: {
      run: {},
      clear: {},
      actionId: "6285d928db0f9c6e620d454a",
      config: {
        timeoutInMillisecond: 10000,
        paginationType: PaginationType.NONE,
        path: "/posts",
        queryParameters: [],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      data: [
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
      ],
      responseMeta: {
        statusCode: "200 OK",
        isExecutionSuccess: true,
        headers: {
          Date: ["Fri, 20 May 2022 09:18:48 GMT"],
          "Content-Type": ["application/json; charset=utf-8"],
          "Transfer-Encoding": ["chunked"],
          Connection: ["keep-alive"],
          "X-Powered-By": ["Express"],
          "X-Ratelimit-Limit": ["1000"],
          "X-Ratelimit-Remaining": ["999"],
          "X-Ratelimit-Reset": ["1652916230"],
          Vary: ["Origin, Accept-Encoding"],
          "Access-Control-Allow-Credentials": ["true"],
          "Cache-Control": ["max-age=43200"],
          Pragma: ["no-cache"],
          Expires: ["-1"],
          "X-Content-Type-Options": ["nosniff"],
          Etag: ['W/"6b80-Ybsq/K6GwwqrYkAsFxqDXGC7DoM"'],
          Via: ["1.1 vegur"],
          "CF-Cache-Status": ["HIT"],
          Age: ["6791"],
          "Expect-CT": [
            'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
          ],
          "Report-To": [
            '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=mL80WXGZevCRJ%2BH3N6Uq0dvpeHk%2BFLrmzIZMCcTnH10LlRna45sxEdLPMELrTur3z3Tr8ucgNQ7X%2FuIhNRTRj00%2FvML3zxIkOIZsrKf3iTIeQDts3oFwUg9b51xg0IDoperi1JchNq5muJETOeT%2B"}],"group":"cf-nel","max_age":604800}',
          ],
          NEL: ['{"success_fraction":0,"report_to":"cf-nel","max_age":604800}'],
          Server: ["cloudflare"],
          "CF-RAY": ["70e3fcb39dde18ce-SIN"],
          "alt-svc": ['h3=":443"; ma=86400, h3-29=":443"; ma=86400'],
          "X-APPSMITH-DATATYPE": ["JSON"],
        },
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      isLoading: false,
      datasourceUrl: "https://jsonplaceholder.typicode.com",
    },
    Text1: {
      widgetName: "Text1",
      displayName: "Text",
      iconSVG: "/static/media/icon.97c59b52.svg",
      topRow: 14,
      bottomRow: 18,
      parentRowSpace: 10,
      type: "TEXT_WIDGET",
      hideCard: false,
      animateLoading: true,
      overflow: "NONE",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 11.796875,
      leftColumn: 21,
      shouldTruncate: false,
      truncateButtonColor: "#FFC13D",
      text: "{{\nApi1.data[2][2].id\n}}",
      key: "ljtoov0cml",
      rightColumn: 37,
      textAlign: "LEFT",
      widgetId: "1p9hcl50i8",
      isVisible: true,
      fontStyle: "BOLD",
      textColor: "#231F20",
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      fontSize: "1rem",
      value: "{{ Text1.text }}",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      meta: {},
    } as unknown as WidgetEntity,
  },
  apiSuccessUnEvalTree3: {
    // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [] ]
    Api1: {
      run: {},
      clear: {},
      actionId: "6285d928db0f9c6e620d454a",
      config: {
        timeoutInMillisecond: 10000,
        paginationType: PaginationType.NONE,
        path: "/posts",
        queryParameters: [],
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
        formData: {
          apiContentType: "none",
        },
      },
      data: [
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [],
      ],
      responseMeta: {
        statusCode: "200 OK",
        isExecutionSuccess: true,
        headers: {
          Date: ["Fri, 20 May 2022 09:18:48 GMT"],
          "Content-Type": ["application/json; charset=utf-8"],
          "Transfer-Encoding": ["chunked"],
          Connection: ["keep-alive"],
          "X-Powered-By": ["Express"],
          "X-Ratelimit-Limit": ["1000"],
          "X-Ratelimit-Remaining": ["999"],
          "X-Ratelimit-Reset": ["1652916230"],
          Vary: ["Origin, Accept-Encoding"],
          "Access-Control-Allow-Credentials": ["true"],
          "Cache-Control": ["max-age=43200"],
          Pragma: ["no-cache"],
          Expires: ["-1"],
          "X-Content-Type-Options": ["nosniff"],
          Etag: ['W/"6b80-Ybsq/K6GwwqrYkAsFxqDXGC7DoM"'],
          Via: ["1.1 vegur"],
          "CF-Cache-Status": ["HIT"],
          Age: ["6791"],
          "Expect-CT": [
            'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
          ],
          "Report-To": [
            '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=mL80WXGZevCRJ%2BH3N6Uq0dvpeHk%2BFLrmzIZMCcTnH10LlRna45sxEdLPMELrTur3z3Tr8ucgNQ7X%2FuIhNRTRj00%2FvML3zxIkOIZsrKf3iTIeQDts3oFwUg9b51xg0IDoperi1JchNq5muJETOeT%2B"}],"group":"cf-nel","max_age":604800}',
          ],
          NEL: ['{"success_fraction":0,"report_to":"cf-nel","max_age":604800}'],
          Server: ["cloudflare"],
          "CF-RAY": ["70e3fcb39dde18ce-SIN"],
          "alt-svc": ['h3=":443"; ma=86400, h3-29=":443"; ma=86400'],
          "X-APPSMITH-DATATYPE": ["JSON"],
        },
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      isLoading: false,
      datasourceUrl: "https://jsonplaceholder.typicode.com",
    },
    // Text1.text binding Api1.data[2][2].id
    Text1: {
      widgetName: "Text1",
      displayName: "Text",
      iconSVG: "/static/media/icon.97c59b52.svg",
      topRow: 14,
      bottomRow: 18,
      parentRowSpace: 10,
      type: "TEXT_WIDGET",
      hideCard: false,
      animateLoading: true,
      overflow: "NONE",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 11.796875,
      leftColumn: 21,
      shouldTruncate: false,
      truncateButtonColor: "#FFC13D",
      text: "{{\nApi1.data[2][2].id\n}}",
      key: "ljtoov0cml",
      rightColumn: 37,
      textAlign: "LEFT",
      widgetId: "1p9hcl50i8",
      isVisible: true,
      fontStyle: "BOLD",
      textColor: "#231F20",
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      fontSize: "1rem",
      value: "{{ Text1.text }}",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      meta: {},
    } as unknown as WidgetEntity,
  },
};

export const nestedArrayAccessorCyclicDependencyConfig = {
  initConfigTree: {
    Api1: {
      name: "Api1",
      actionId: "6285d928db0f9c6e620d454a",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths: {
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
        "config.queryParameters[0].key": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[0].value": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[1].key": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[1].value": EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
        datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
        "config.queryParameters[0].key": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[0].value": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[1].key": EvaluationSubstitutionType.TEMPLATE,
        "config.queryParameters[1].value": EvaluationSubstitutionType.TEMPLATE,
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    } as unknown as ActionEntityConfig,
    Text1: {
      type: "TEXT_WIDGET",
      widgetId: "1p9hcl50i8",
      privateWidgets: {},
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultProps: {},
      defaultMetaProps: [],
      logBlackList: {
        value: true,
      },
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      dynamicTriggerPathList: [],
      dynamicBindingPathList: [
        {
          key: "fontFamily",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
        {
          key: "value",
        },
      ],
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        value: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {},
      validationPaths: {
        text: {
          type: "TEXT",
          params: {
            limitLineBreaks: true,
          },
        },
        isVisible: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        disableLink: {
          type: "BOOLEAN",
        },
        backgroundColor: {
          type: "TEXT",
          params: {
            regex: {},
            expected: {
              type: "string (HTML color name or HEX value)",
              example: "red | #9C0D38",
              autocompleteDataType: "STRING",
            },
          },
        },
        textColor: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
        borderColor: {
          type: "TEXT",
        },
        borderWidth: {
          type: "NUMBER",
        },
        fontSize: {
          type: "TEXT",
        },
        fontFamily: {
          type: "TEXT",
        },
        fontStyle: {
          type: "TEXT",
        },
        textAlign: {
          type: "TEXT",
        },
      },
    } as unknown as WidgetEntityConfig,
  },
  apiSuccessConfigTree: {
    Api1: {
      name: "Api1",
      pluginId: "5ca385dc81b37f0004b4db85",
      actionId: "6285d928db0f9c6e620d454a",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths: {
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
        datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    } as unknown as ActionEntityConfig,
    Text1: {
      widgetId: "1p9hcl50i8",
      type: "TEXT_WIDGET",
      dynamicTriggerPathList: [],
      dynamicBindingPathList: [
        {
          key: "fontFamily",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
        {
          key: "value",
        },
      ],
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      privateWidgets: {},
      defaultProps: {},
      defaultMetaProps: [],
      logBlackList: {
        value: true,
      },
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        value: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {},
      validationPaths: {
        text: {
          type: "TEXT",
          params: {
            limitLineBreaks: true,
          },
        },
        isVisible: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        disableLink: {
          type: "BOOLEAN",
        },
        backgroundColor: {
          type: "TEXT",
          params: {
            regex: {},
            expected: {
              type: "string (HTML color name or HEX value)",
              example: "red | #9C0D38",
              autocompleteDataType: "STRING",
            },
          },
        },
        textColor: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
        borderColor: {
          type: "TEXT",
        },
        borderWidth: {
          type: "NUMBER",
        },
        fontSize: {
          type: "TEXT",
        },
        fontFamily: {
          type: "TEXT",
        },
        fontStyle: {
          type: "TEXT",
        },
        textAlign: {
          type: "TEXT",
        },
      },
    } as unknown as WidgetEntityConfig,
  },
  apiFailureConfigTree: {
    Api1: {
      name: "Api1",
      pluginId: "5ca385dc81b37f0004b4db85",
      actionId: "6285d928db0f9c6e620d454a",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths: {
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
        datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    } as unknown as ActionEntityConfig,
    Text1: {
      type: "TEXT_WIDGET",
      dynamicTriggerPathList: [],
      dynamicBindingPathList: [
        {
          key: "fontFamily",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
        {
          key: "value",
        },
      ],
      widgetId: "1p9hcl50i8",
      privateWidgets: {},
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultProps: {},
      defaultMetaProps: [],
      logBlackList: {
        value: true,
      },
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        value: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {},
      validationPaths: {
        text: {
          type: "TEXT",
          params: {
            limitLineBreaks: true,
          },
        },
        isVisible: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        disableLink: {
          type: "BOOLEAN",
        },
        backgroundColor: {
          type: "TEXT",
          params: {
            regex: {},
            expected: {
              type: "string (HTML color name or HEX value)",
              example: "red | #9C0D38",
              autocompleteDataType: "STRING",
            },
          },
        },
        textColor: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
        borderColor: {
          type: "TEXT",
        },
        borderWidth: {
          type: "NUMBER",
        },
        fontSize: {
          type: "TEXT",
        },
        fontFamily: {
          type: "TEXT",
        },
        fontStyle: {
          type: "TEXT",
        },
        textAlign: {
          type: "TEXT",
        },
      },
    } as unknown as WidgetEntityConfig,
  },
  apiSuccessConfigTree2: {
    Api1: {
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      name: "Api1",
      actionId: "6285d928db0f9c6e620d454a",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      bindingPaths: {
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
        datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    } as unknown as ActionEntityConfig,
    Text1: {
      type: "TEXT_WIDGET",
      dynamicTriggerPathList: [],
      dynamicBindingPathList: [
        {
          key: "fontFamily",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
        {
          key: "value",
        },
      ],
      widgetId: "1p9hcl50i8",
      privateWidgets: {},
      defaultProps: {},
      defaultMetaProps: [],
      logBlackList: {
        value: true,
      },
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        value: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {},
      validationPaths: {
        text: {
          type: "TEXT",
          params: {
            limitLineBreaks: true,
          },
        },
        isVisible: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        disableLink: {
          type: "BOOLEAN",
        },
        backgroundColor: {
          type: "TEXT",
          params: {
            regex: {},
            expected: {
              type: "string (HTML color name or HEX value)",
              example: "red | #9C0D38",
              autocompleteDataType: "STRING",
            },
          },
        },
        textColor: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
        borderColor: {
          type: "TEXT",
        },
        borderWidth: {
          type: "NUMBER",
        },
        fontSize: {
          type: "TEXT",
        },
        fontFamily: {
          type: "TEXT",
        },
        fontStyle: {
          type: "TEXT",
        },
        textAlign: {
          type: "TEXT",
        },
      },
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    } as unknown as WidgetEntityConfig,
  },
  apiSuccessConfigTree3: {
    Api1: {
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      name: "Api1",
      actionId: "6285d928db0f9c6e620d454a",
      pluginId: "5ca385dc81b37f0004b4db85",
      pluginType: PluginType.API,
      dynamicBindingPathList: [],
      bindingPaths: {
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      reactivePaths: {
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
        datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
        "config.path": EvaluationSubstitutionType.TEMPLATE,
        "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
    } as unknown as ActionEntityConfig,
    Text1: {
      widgetId: "1p9hcl50i8",
      type: "TEXT_WIDGET",
      privateWidgets: {},
      dynamicTriggerPathList: [],
      dynamicBindingPathList: [
        {
          key: "fontFamily",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
        {
          key: "value",
        },
      ],
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultProps: {},
      defaultMetaProps: [],
      logBlackList: {
        value: true,
      },
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      reactivePaths: {
        value: EvaluationSubstitutionType.TEMPLATE,
        fontFamily: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        disableLink: EvaluationSubstitutionType.TEMPLATE,
        backgroundColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        borderColor: EvaluationSubstitutionType.TEMPLATE,
        borderWidth: EvaluationSubstitutionType.TEMPLATE,
        fontSize: EvaluationSubstitutionType.TEMPLATE,
        fontStyle: EvaluationSubstitutionType.TEMPLATE,
        textAlign: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {},
      validationPaths: {
        text: {
          type: "TEXT",
          params: {
            limitLineBreaks: true,
          },
        },
        isVisible: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        disableLink: {
          type: "BOOLEAN",
        },
        backgroundColor: {
          type: "TEXT",
          params: {
            regex: {},
            expected: {
              type: "string (HTML color name or HEX value)",
              example: "red | #9C0D38",
              autocompleteDataType: "STRING",
            },
          },
        },
        textColor: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
        borderColor: {
          type: "TEXT",
        },
        borderWidth: {
          type: "NUMBER",
        },
        fontSize: {
          type: "TEXT",
        },
        fontFamily: {
          type: "TEXT",
        },
        fontStyle: {
          type: "TEXT",
        },
        textAlign: {
          type: "TEXT",
        },
      },
    } as unknown as WidgetEntityConfig,
  },
};
