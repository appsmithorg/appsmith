import * as React from "react";
import { useState } from "react";
import { useThemeContext } from "@appsmith/wds-theming";
import { objectKeys } from "@appsmith/utils";

export const CompareTokens = () => {
  const [leftBg, setLeftBg] = useState<string>();
  const [leftFg, setLeftFg] = useState<string>();
  const [leftBd, setLeftBd] = useState<string>();
  const [rightBg, setRightBg] = useState<string>();
  const [rightFg, setRightFg] = useState<string>();
  const [rightBd, setRightBd] = useState<string>();

  const theme = useThemeContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const color = theme?.color as any;

  return (
    <div
      style={{
        display: "flex",
        gap: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div
          style={{
            width: "300px",
            height: "300px",
            background: `var(--color-${leftBg})`,
            color: `var(--color-${leftFg})`,
            border: `5px solid var(--color-${leftBd})`,
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Lorem ipsum
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <select onChange={(e) => setLeftBg(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("bg"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
          <select onChange={(e) => setLeftFg(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("fg"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
          <select onChange={(e) => setLeftBd(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("bd"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div
          style={{
            width: "300px",
            height: "300px",
            background: `var(--color-${rightBg})`,
            color: `var(--color-${rightFg})`,
            border: `5px solid var(--color-${rightBd})`,
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Lorem ipsum
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <select onChange={(e) => setRightBg(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("bg"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
          <select onChange={(e) => setRightFg(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("fg"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
          <select onChange={(e) => setRightBd(e.target.value)}>
            {(objectKeys(color) as string[])
              .filter((key) => key.includes("bd"))
              .map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};
