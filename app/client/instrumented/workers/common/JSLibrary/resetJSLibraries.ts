function cov_2ccniges2c() {
  var path = "/Users/apple/github/appsmith/app/client/src/workers/common/JSLibrary/resetJSLibraries.ts";
  var hash = "599c7cc9349fd15fdaf2c5ffc2dd0c5f5979fee4";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/workers/common/JSLibrary/resetJSLibraries.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 34
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "1": {
        start: {
          line: 18,
          column: 2
        },
        end: {
          line: 18,
          column: 25
        }
      },
      "2": {
        start: {
          line: 19,
          column: 2
        },
        end: {
          line: 19,
          column: 40
        }
      },
      "3": {
        start: {
          line: 20,
          column: 34
        },
        end: {
          line: 22,
          column: 3
        }
      },
      "4": {
        start: {
          line: 21,
          column: 13
        },
        end: {
          line: 21,
          column: 28
        }
      },
      "5": {
        start: {
          line: 23,
          column: 2
        },
        end: {
          line: 33,
          column: 3
        }
      },
      "6": {
        start: {
          line: 24,
          column: 4
        },
        end: {
          line: 24,
          column: 56
        }
      },
      "7": {
        start: {
          line: 24,
          column: 47
        },
        end: {
          line: 24,
          column: 56
        }
      },
      "8": {
        start: {
          line: 25,
          column: 4
        },
        end: {
          line: 31,
          column: 5
        }
      },
      "9": {
        start: {
          line: 27,
          column: 6
        },
        end: {
          line: 27,
          column: 23
        }
      },
      "10": {
        start: {
          line: 30,
          column: 6
        },
        end: {
          line: 30,
          column: 28
        }
      },
      "11": {
        start: {
          line: 32,
          column: 4
        },
        end: {
          line: 32,
          column: 43
        }
      },
      "12": {
        start: {
          line: 35,
          column: 2
        },
        end: {
          line: 43,
          column: 5
        }
      },
      "13": {
        start: {
          line: 36,
          column: 4
        },
        end: {
          line: 39,
          column: 8
        }
      },
      "14": {
        start: {
          line: 37,
          column: 6
        },
        end: {
          line: 39,
          column: 8
        }
      },
      "15": {
        start: {
          line: 42,
          column: 4
        },
        end: {
          line: 42,
          column: 69
        }
      }
    },
    fnMap: {
      "0": {
        name: "resetJSLibraries",
        decl: {
          start: {
            line: 17,
            column: 16
          },
          end: {
            line: 17,
            column: 32
          }
        },
        loc: {
          start: {
            line: 17,
            column: 35
          },
          end: {
            line: 44,
            column: 1
          }
        },
        line: 17
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 21,
            column: 4
          },
          end: {
            line: 21,
            column: 5
          }
        },
        loc: {
          start: {
            line: 21,
            column: 13
          },
          end: {
            line: 21,
            column: 28
          }
        },
        line: 21
      },
      "2": {
        name: "(anonymous_2)",
        decl: {
          start: {
            line: 35,
            column: 22
          },
          end: {
            line: 35,
            column: 23
          }
        },
        loc: {
          start: {
            line: 35,
            column: 35
          },
          end: {
            line: 43,
            column: 3
          }
        },
        line: 35
      }
    },
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 24,
            column: 4
          },
          end: {
            line: 24,
            column: 56
          }
        },
        type: "if",
        locations: [{
          start: {
            line: 24,
            column: 4
          },
          end: {
            line: 24,
            column: 56
          }
        }, {
          start: {
            line: 24,
            column: 4
          },
          end: {
            line: 24,
            column: 56
          }
        }],
        line: 24
      },
      "1": {
        loc: {
          start: {
            line: 36,
            column: 4
          },
          end: {
            line: 39,
            column: 8
          }
        },
        type: "if",
        locations: [{
          start: {
            line: 36,
            column: 4
          },
          end: {
            line: 39,
            column: 8
          }
        }, {
          start: {
            line: 36,
            column: 4
          },
          end: {
            line: 39,
            column: 8
          }
        }],
        line: 36
      }
    },
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0,
      "15": 0
    },
    f: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    b: {
      "0": [0, 0],
      "1": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "599c7cc9349fd15fdaf2c5ffc2dd0c5f5979fee4"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2ccniges2c = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2ccniges2c();
import _ from "./lodash-wrapper";
import moment from "moment-timezone";
import parser from "fast-xml-parser";
import forge from "node-forge";
import { defaultLibraries } from "./index";
import { JSLibraries, libraryReservedIdentifiers } from "./index";
const defaultLibImplementations = (cov_2ccniges2c().s[0]++, {
  lodash: _,
  moment: moment,
  xmlParser: parser,
  // We are removing some functionalities of node-forge because they wont
  // work in the worker thread
  forge: /*#__PURE*/_.omit(forge, ["tls", "http", "xhr", "socket", "task"])
});
export function resetJSLibraries() {
  cov_2ccniges2c().f[0]++;
  cov_2ccniges2c().s[1]++;
  JSLibraries.length = 0;
  cov_2ccniges2c().s[2]++;
  JSLibraries.push(...defaultLibraries);
  const defaultLibraryAccessors = (cov_2ccniges2c().s[3]++, defaultLibraries.map(lib => {
    cov_2ccniges2c().f[1]++;
    cov_2ccniges2c().s[4]++;
    return lib.accessor[0];
  }));
  cov_2ccniges2c().s[5]++;
  for (const key of Object.keys(libraryReservedIdentifiers)) {
    cov_2ccniges2c().s[6]++;
    if (defaultLibraryAccessors.includes(key)) {
      cov_2ccniges2c().b[0][0]++;
      cov_2ccniges2c().s[7]++;
      continue;
    } else {
      cov_2ccniges2c().b[0][1]++;
    }
    cov_2ccniges2c().s[8]++;
    try {
      cov_2ccniges2c().s[9]++;
      // @ts-expect-error: Types are not available
      delete self[key];
    } catch (e) {
      cov_2ccniges2c().s[10]++;
      // @ts-expect-error: Types are not available
      self[key] = undefined;
    }
    cov_2ccniges2c().s[11]++;
    delete libraryReservedIdentifiers[key];
  }
  cov_2ccniges2c().s[12]++;
  JSLibraries.forEach(library => {
    cov_2ccniges2c().f[2]++;
    cov_2ccniges2c().s[13]++;
    if (!(library.name in defaultLibImplementations)) {
      cov_2ccniges2c().b[1][0]++;
      cov_2ccniges2c().s[14]++;
      throw new Error(`resetJSLibraries(): implementation for library ${library.name} not found. Have you forgotten to add it to the defaultLibrariesImpls object?`);
    } else {
      cov_2ccniges2c().b[1][1]++;
    }

    // @ts-expect-error: Types are not available
    cov_2ccniges2c().s[15]++;
    self[library.accessor] = defaultLibImplementations[library.name];
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmNjbmlnZXMyYyIsImFjdHVhbENvdmVyYWdlIiwiXyIsIm1vbWVudCIsInBhcnNlciIsImZvcmdlIiwiZGVmYXVsdExpYnJhcmllcyIsIkpTTGlicmFyaWVzIiwibGlicmFyeVJlc2VydmVkSWRlbnRpZmllcnMiLCJkZWZhdWx0TGliSW1wbGVtZW50YXRpb25zIiwicyIsImxvZGFzaCIsInhtbFBhcnNlciIsIm9taXQiLCJyZXNldEpTTGlicmFyaWVzIiwiZiIsImxlbmd0aCIsInB1c2giLCJkZWZhdWx0TGlicmFyeUFjY2Vzc29ycyIsIm1hcCIsImxpYiIsImFjY2Vzc29yIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsImluY2x1ZGVzIiwiYiIsInNlbGYiLCJlIiwidW5kZWZpbmVkIiwiZm9yRWFjaCIsImxpYnJhcnkiLCJuYW1lIiwiRXJyb3IiXSwic291cmNlcyI6WyJyZXNldEpTTGlicmFyaWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCIuL2xvZGFzaC13cmFwcGVyXCI7XG5pbXBvcnQgbW9tZW50IGZyb20gXCJtb21lbnQtdGltZXpvbmVcIjtcbmltcG9ydCBwYXJzZXIgZnJvbSBcImZhc3QteG1sLXBhcnNlclwiO1xuaW1wb3J0IGZvcmdlIGZyb20gXCJub2RlLWZvcmdlXCI7XG5pbXBvcnQgeyBkZWZhdWx0TGlicmFyaWVzIH0gZnJvbSBcIi4vaW5kZXhcIjtcbmltcG9ydCB7IEpTTGlicmFyaWVzLCBsaWJyYXJ5UmVzZXJ2ZWRJZGVudGlmaWVycyB9IGZyb20gXCIuL2luZGV4XCI7XG5cbmNvbnN0IGRlZmF1bHRMaWJJbXBsZW1lbnRhdGlvbnMgPSB7XG4gIGxvZGFzaDogXyxcbiAgbW9tZW50OiBtb21lbnQsXG4gIHhtbFBhcnNlcjogcGFyc2VyLFxuICAvLyBXZSBhcmUgcmVtb3Zpbmcgc29tZSBmdW5jdGlvbmFsaXRpZXMgb2Ygbm9kZS1mb3JnZSBiZWNhdXNlIHRoZXkgd29udFxuICAvLyB3b3JrIGluIHRoZSB3b3JrZXIgdGhyZWFkXG4gIGZvcmdlOiAvKiNfX1BVUkUqLyBfLm9taXQoZm9yZ2UsIFtcInRsc1wiLCBcImh0dHBcIiwgXCJ4aHJcIiwgXCJzb2NrZXRcIiwgXCJ0YXNrXCJdKSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldEpTTGlicmFyaWVzKCkge1xuICBKU0xpYnJhcmllcy5sZW5ndGggPSAwO1xuICBKU0xpYnJhcmllcy5wdXNoKC4uLmRlZmF1bHRMaWJyYXJpZXMpO1xuICBjb25zdCBkZWZhdWx0TGlicmFyeUFjY2Vzc29ycyA9IGRlZmF1bHRMaWJyYXJpZXMubWFwKFxuICAgIChsaWIpID0+IGxpYi5hY2Nlc3NvclswXSxcbiAgKTtcbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMobGlicmFyeVJlc2VydmVkSWRlbnRpZmllcnMpKSB7XG4gICAgaWYgKGRlZmF1bHRMaWJyYXJ5QWNjZXNzb3JzLmluY2x1ZGVzKGtleSkpIGNvbnRpbnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yOiBUeXBlcyBhcmUgbm90IGF2YWlsYWJsZVxuICAgICAgZGVsZXRlIHNlbGZba2V5XTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yOiBUeXBlcyBhcmUgbm90IGF2YWlsYWJsZVxuICAgICAgc2VsZltrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBkZWxldGUgbGlicmFyeVJlc2VydmVkSWRlbnRpZmllcnNba2V5XTtcbiAgfVxuXG4gIEpTTGlicmFyaWVzLmZvckVhY2goKGxpYnJhcnkpID0+IHtcbiAgICBpZiAoIShsaWJyYXJ5Lm5hbWUgaW4gZGVmYXVsdExpYkltcGxlbWVudGF0aW9ucykpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGByZXNldEpTTGlicmFyaWVzKCk6IGltcGxlbWVudGF0aW9uIGZvciBsaWJyYXJ5ICR7bGlicmFyeS5uYW1lfSBub3QgZm91bmQuIEhhdmUgeW91IGZvcmdvdHRlbiB0byBhZGQgaXQgdG8gdGhlIGRlZmF1bHRMaWJyYXJpZXNJbXBscyBvYmplY3Q/YCxcbiAgICAgICk7XG5cbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yOiBUeXBlcyBhcmUgbm90IGF2YWlsYWJsZVxuICAgIHNlbGZbbGlicmFyeS5hY2Nlc3Nvcl0gPSBkZWZhdWx0TGliSW1wbGVtZW50YXRpb25zW2xpYnJhcnkubmFtZV07XG4gIH0pO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPRSxDQUFDLE1BQU0sa0JBQWtCO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxpQkFBaUI7QUFDcEMsT0FBT0MsTUFBTSxNQUFNLGlCQUFpQjtBQUNwQyxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUM5QixTQUFTQyxnQkFBZ0IsUUFBUSxTQUFTO0FBQzFDLFNBQVNDLFdBQVcsRUFBRUMsMEJBQTBCLFFBQVEsU0FBUztBQUVqRSxNQUFNQyx5QkFBeUIsSUFBQVQsY0FBQSxHQUFBVSxDQUFBLE9BQUc7RUFDaENDLE1BQU0sRUFBRVQsQ0FBQztFQUNUQyxNQUFNLEVBQUVBLE1BQU07RUFDZFMsU0FBUyxFQUFFUixNQUFNO0VBQ2pCO0VBQ0E7RUFDQUMsS0FBSyxFQUFFLFdBQVlILENBQUMsQ0FBQ1csSUFBSSxDQUFDUixLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDO0FBQzNFLENBQUM7QUFFRCxPQUFPLFNBQVNTLGdCQUFnQkEsQ0FBQSxFQUFHO0VBQUFkLGNBQUEsR0FBQWUsQ0FBQTtFQUFBZixjQUFBLEdBQUFVLENBQUE7RUFDakNILFdBQVcsQ0FBQ1MsTUFBTSxHQUFHLENBQUM7RUFBQ2hCLGNBQUEsR0FBQVUsQ0FBQTtFQUN2QkgsV0FBVyxDQUFDVSxJQUFJLENBQUMsR0FBR1gsZ0JBQWdCLENBQUM7RUFDckMsTUFBTVksdUJBQXVCLElBQUFsQixjQUFBLEdBQUFVLENBQUEsT0FBR0osZ0JBQWdCLENBQUNhLEdBQUcsQ0FDakRDLEdBQUcsSUFBSztJQUFBcEIsY0FBQSxHQUFBZSxDQUFBO0lBQUFmLGNBQUEsR0FBQVUsQ0FBQTtJQUFBLE9BQUFVLEdBQUcsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQztFQUFELENBQ3pCLENBQUM7RUFBQ3JCLGNBQUEsR0FBQVUsQ0FBQTtFQUNGLEtBQUssTUFBTVksR0FBRyxJQUFJQyxNQUFNLENBQUNDLElBQUksQ0FBQ2hCLDBCQUEwQixDQUFDLEVBQUU7SUFBQVIsY0FBQSxHQUFBVSxDQUFBO0lBQ3pELElBQUlRLHVCQUF1QixDQUFDTyxRQUFRLENBQUNILEdBQUcsQ0FBQyxFQUFFO01BQUF0QixjQUFBLEdBQUEwQixDQUFBO01BQUExQixjQUFBLEdBQUFVLENBQUE7TUFBQTtJQUFRLENBQUM7TUFBQVYsY0FBQSxHQUFBMEIsQ0FBQTtJQUFBO0lBQUExQixjQUFBLEdBQUFVLENBQUE7SUFDcEQsSUFBSTtNQUFBVixjQUFBLEdBQUFVLENBQUE7TUFDRjtNQUNBLE9BQU9pQixJQUFJLENBQUNMLEdBQUcsQ0FBQztJQUNsQixDQUFDLENBQUMsT0FBT00sQ0FBQyxFQUFFO01BQUE1QixjQUFBLEdBQUFVLENBQUE7TUFDVjtNQUNBaUIsSUFBSSxDQUFDTCxHQUFHLENBQUMsR0FBR08sU0FBUztJQUN2QjtJQUFDN0IsY0FBQSxHQUFBVSxDQUFBO0lBQ0QsT0FBT0YsMEJBQTBCLENBQUNjLEdBQUcsQ0FBQztFQUN4QztFQUFDdEIsY0FBQSxHQUFBVSxDQUFBO0VBRURILFdBQVcsQ0FBQ3VCLE9BQU8sQ0FBRUMsT0FBTyxJQUFLO0lBQUEvQixjQUFBLEdBQUFlLENBQUE7SUFBQWYsY0FBQSxHQUFBVSxDQUFBO0lBQy9CLElBQUksRUFBRXFCLE9BQU8sQ0FBQ0MsSUFBSSxJQUFJdkIseUJBQXlCLENBQUMsRUFDOUM7TUFBQVQsY0FBQSxHQUFBMEIsQ0FBQTtNQUFBMUIsY0FBQSxHQUFBVSxDQUFBO01BQUEsTUFBTSxJQUFJdUIsS0FBSyxDQUNaLGtEQUFpREYsT0FBTyxDQUFDQyxJQUFLLCtFQUNqRSxDQUFDO0lBQUEsQ0FBQztNQUFBaEMsY0FBQSxHQUFBMEIsQ0FBQTtJQUFBOztJQUVKO0lBQUExQixjQUFBLEdBQUFVLENBQUE7SUFDQWlCLElBQUksQ0FBQ0ksT0FBTyxDQUFDVixRQUFRLENBQUMsR0FBR1oseUJBQXlCLENBQUNzQixPQUFPLENBQUNDLElBQUksQ0FBQztFQUNsRSxDQUFDLENBQUM7QUFDSiJ9