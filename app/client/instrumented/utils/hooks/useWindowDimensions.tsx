function cov_2p93abxe8s() {
  var path = "/Users/apple/github/appsmith/app/client/src/utils/hooks/useWindowDimensions.tsx";
  var hash = "a95fb477f271561c349a6722521663577e924d2e";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/utils/hooks/useWindowDimensions.tsx",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 24
        },
        end: {
          line: 20,
          column: 1
        }
      },
      "1": {
        start: {
          line: 4,
          column: 42
        },
        end: {
          line: 4,
          column: 70
        }
      },
      "2": {
        start: {
          line: 5,
          column: 40
        },
        end: {
          line: 5,
          column: 67
        }
      },
      "3": {
        start: {
          line: 7,
          column: 2
        },
        end: {
          line: 17,
          column: 9
        }
      },
      "4": {
        start: {
          line: 8,
          column: 31
        },
        end: {
          line: 11,
          column: 5
        }
      },
      "5": {
        start: {
          line: 9,
          column: 6
        },
        end: {
          line: 9,
          column: 42
        }
      },
      "6": {
        start: {
          line: 10,
          column: 6
        },
        end: {
          line: 10,
          column: 40
        }
      },
      "7": {
        start: {
          line: 12,
          column: 4
        },
        end: {
          line: 12,
          column: 58
        }
      },
      "8": {
        start: {
          line: 14,
          column: 4
        },
        end: {
          line: 16,
          column: 6
        }
      },
      "9": {
        start: {
          line: 15,
          column: 6
        },
        end: {
          line: 15,
          column: 63
        }
      },
      "10": {
        start: {
          line: 19,
          column: 2
        },
        end: {
          line: 19,
          column: 37
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 24
          },
          end: {
            line: 3,
            column: 25
          }
        },
        loc: {
          start: {
            line: 3,
            column: 30
          },
          end: {
            line: 20,
            column: 1
          }
        },
        line: 3
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 7,
            column: 12
          },
          end: {
            line: 7,
            column: 13
          }
        },
        loc: {
          start: {
            line: 7,
            column: 18
          },
          end: {
            line: 17,
            column: 3
          }
        },
        line: 7
      },
      "2": {
        name: "(anonymous_2)",
        decl: {
          start: {
            line: 8,
            column: 31
          },
          end: {
            line: 8,
            column: 32
          }
        },
        loc: {
          start: {
            line: 8,
            column: 37
          },
          end: {
            line: 11,
            column: 5
          }
        },
        line: 8
      },
      "3": {
        name: "(anonymous_3)",
        decl: {
          start: {
            line: 14,
            column: 11
          },
          end: {
            line: 14,
            column: 12
          }
        },
        loc: {
          start: {
            line: 14,
            column: 17
          },
          end: {
            line: 16,
            column: 5
          }
        },
        line: 14
      }
    },
    branchMap: {},
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
      "10": 0
    },
    f: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "a95fb477f271561c349a6722521663577e924d2e"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2p93abxe8s = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2p93abxe8s();
import { useEffect, useState } from "react";
cov_2p93abxe8s().s[0]++;
const useWindowHeight = () => {
  cov_2p93abxe8s().f[0]++;
  const [windowHeight, setWindowHeight] = (cov_2p93abxe8s().s[1]++, useState(window.innerHeight));
  const [windowWidth, setWindowWidth] = (cov_2p93abxe8s().s[2]++, useState(window.innerWidth));
  cov_2p93abxe8s().s[3]++;
  useEffect(() => {
    cov_2p93abxe8s().f[1]++;
    cov_2p93abxe8s().s[4]++;
    const handleWindowResize = () => {
      cov_2p93abxe8s().f[2]++;
      cov_2p93abxe8s().s[5]++;
      setWindowHeight(window.innerHeight);
      cov_2p93abxe8s().s[6]++;
      setWindowWidth(window.innerWidth);
    };
    cov_2p93abxe8s().s[7]++;
    window.addEventListener("resize", handleWindowResize);
    cov_2p93abxe8s().s[8]++;
    return () => {
      cov_2p93abxe8s().f[3]++;
      cov_2p93abxe8s().s[9]++;
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);
  cov_2p93abxe8s().s[10]++;
  return [windowWidth, windowHeight];
};
export default useWindowHeight;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnA5M2FieGU4cyIsImFjdHVhbENvdmVyYWdlIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJzIiwidXNlV2luZG93SGVpZ2h0IiwiZiIsIndpbmRvd0hlaWdodCIsInNldFdpbmRvd0hlaWdodCIsIndpbmRvdyIsImlubmVySGVpZ2h0Iiwid2luZG93V2lkdGgiLCJzZXRXaW5kb3dXaWR0aCIsImlubmVyV2lkdGgiLCJoYW5kbGVXaW5kb3dSZXNpemUiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VzIjpbInVzZVdpbmRvd0RpbWVuc2lvbnMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcblxuY29uc3QgdXNlV2luZG93SGVpZ2h0ID0gKCkgPT4ge1xuICBjb25zdCBbd2luZG93SGVpZ2h0LCBzZXRXaW5kb3dIZWlnaHRdID0gdXNlU3RhdGUod2luZG93LmlubmVySGVpZ2h0KTtcbiAgY29uc3QgW3dpbmRvd1dpZHRoLCBzZXRXaW5kb3dXaWR0aF0gPSB1c2VTdGF0ZSh3aW5kb3cuaW5uZXJXaWR0aCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVXaW5kb3dSZXNpemUgPSAoKSA9PiB7XG4gICAgICBzZXRXaW5kb3dIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcbiAgICAgIHNldFdpbmRvd1dpZHRoKHdpbmRvdy5pbm5lcldpZHRoKTtcbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGhhbmRsZVdpbmRvd1Jlc2l6ZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgaGFuZGxlV2luZG93UmVzaXplKTtcbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgcmV0dXJuIFt3aW5kb3dXaWR0aCwgd2luZG93SGVpZ2h0XTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHVzZVdpbmRvd0hlaWdodDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxTQUFTLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQUNILGNBQUEsR0FBQUksQ0FBQTtBQUU1QyxNQUFNQyxlQUFlLEdBQUdBLENBQUEsS0FBTTtFQUFBTCxjQUFBLEdBQUFNLENBQUE7RUFDNUIsTUFBTSxDQUFDQyxZQUFZLEVBQUVDLGVBQWUsQ0FBQyxJQUFBUixjQUFBLEdBQUFJLENBQUEsT0FBR0QsUUFBUSxDQUFDTSxNQUFNLENBQUNDLFdBQVcsQ0FBQztFQUNwRSxNQUFNLENBQUNDLFdBQVcsRUFBRUMsY0FBYyxDQUFDLElBQUFaLGNBQUEsR0FBQUksQ0FBQSxPQUFHRCxRQUFRLENBQUNNLE1BQU0sQ0FBQ0ksVUFBVSxDQUFDO0VBQUNiLGNBQUEsR0FBQUksQ0FBQTtFQUVsRUYsU0FBUyxDQUFDLE1BQU07SUFBQUYsY0FBQSxHQUFBTSxDQUFBO0lBQUFOLGNBQUEsR0FBQUksQ0FBQTtJQUNkLE1BQU1VLGtCQUFrQixHQUFHQSxDQUFBLEtBQU07TUFBQWQsY0FBQSxHQUFBTSxDQUFBO01BQUFOLGNBQUEsR0FBQUksQ0FBQTtNQUMvQkksZUFBZSxDQUFDQyxNQUFNLENBQUNDLFdBQVcsQ0FBQztNQUFDVixjQUFBLEdBQUFJLENBQUE7TUFDcENRLGNBQWMsQ0FBQ0gsTUFBTSxDQUFDSSxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUFDYixjQUFBLEdBQUFJLENBQUE7SUFDRkssTUFBTSxDQUFDTSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUVELGtCQUFrQixDQUFDO0lBQUNkLGNBQUEsR0FBQUksQ0FBQTtJQUV0RCxPQUFPLE1BQU07TUFBQUosY0FBQSxHQUFBTSxDQUFBO01BQUFOLGNBQUEsR0FBQUksQ0FBQTtNQUNYSyxNQUFNLENBQUNPLG1CQUFtQixDQUFDLFFBQVEsRUFBRUYsa0JBQWtCLENBQUM7SUFDMUQsQ0FBQztFQUNILENBQUMsRUFBRSxFQUFFLENBQUM7RUFBQ2QsY0FBQSxHQUFBSSxDQUFBO0VBRVAsT0FBTyxDQUFDTyxXQUFXLEVBQUVKLFlBQVksQ0FBQztBQUNwQyxDQUFDO0FBRUQsZUFBZUYsZUFBZSJ9