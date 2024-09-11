import * as React from "react";
import { Flex, Button, Text } from "@appsmith/wds";

export const Elevation = () => {
  return (
    <Flex direction="column" gap="spacing-8">
      <Flex direction="row" gap="spacing-6">
        <Flex alignItems="center" direction="column" gap="spacing-4">
          <Text size="subtitle">Border</Text>
          <Flex
            direction="column"
            padding="spacing-6"
            style={{
              background: "var(--color-bg-elevation-1)",
              borderColor: "var(--color-bd-elevation-1)",
              borderRadius: "var(--border-radius-elevation-1)",
              borderStyle: "solid",
              borderWidth: 1,
            }}
          >
            <Flex
              direction="column"
              padding="spacing-6"
              style={{
                background: "var(--color-bg-elevation-2)",
                borderColor: "var(--color-bd-elevation-2)",
                borderRadius: "var(--border-radius-elevation-2)",
                borderStyle: "solid",
                borderWidth: 1,
              }}
            >
              <Flex
                direction="column"
                padding="spacing-6"
                style={{
                  background: "var(--color-bg-elevation-3)",
                  borderColor: "var(--color-bd-elevation-3)",
                  borderRadius: "var(--border-radius-elevation-3)",
                  borderStyle: "solid",
                  borderWidth: 1,
                }}
              >
                <Button>Do the Thing</Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex alignItems="center" direction="column" gap="spacing-4">
          <Text size="subtitle">Shadow</Text>
          <Flex
            direction="column"
            padding="spacing-6"
            style={{
              background: "var(--color-bg-elevation-1)",
              borderRadius: "var(--border-radius-elevation-1)",
              boxShadow: "var(--box-shadow-1)",
            }}
          >
            <Flex
              direction="column"
              padding="spacing-6"
              style={{
                background: "var(--color-bg-elevation-2)",
                borderRadius: "var(--border-radius-elevation-2)",
                boxShadow: "var(--box-shadow-2)",
              }}
            >
              <Flex
                direction="column"
                padding="spacing-6"
                style={{
                  background: "var(--color-bg-elevation-3)",
                  borderRadius: "var(--border-radius-elevation-3)",
                  boxShadow: "var(--box-shadow-3)",
                }}
              >
                <Button>Do the Thing</Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction="row" gap="spacing-6">
        <Flex alignItems="center" direction="column" gap="spacing-4">
          <Text size="subtitle">Both</Text>
          <Flex
            direction="column"
            padding="spacing-6"
            style={{
              background: "var(--color-bg-elevation-1)",
              borderColor: "var(--color-bd-elevation-1)",
              borderRadius: "var(--border-radius-elevation-1)",
              borderStyle: "solid",
              borderWidth: 1,
              boxShadow: "var(--box-shadow-1)",
            }}
          >
            <Flex
              direction="column"
              padding="spacing-6"
              style={{
                background: "var(--color-bg-elevation-2)",
                borderColor: "var(--color-bd-elevation-2)",
                borderRadius: "var(--border-radius-elevation-2)",
                borderStyle: "solid",
                borderWidth: 1,
                boxShadow: "var(--box-shadow-2)",
              }}
            >
              <Flex
                direction="column"
                padding="spacing-6"
                style={{
                  background: "var(--color-bg-elevation-3)",
                  borderColor: "var(--color-bd-elevation-3)",
                  borderRadius: "var(--border-radius-elevation-3)",
                  borderStyle: "solid",
                  borderWidth: 1,
                  boxShadow: "var(--box-shadow-3)",
                }}
              >
                <Button>Do the Thing</Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex alignItems="center" direction="column" gap="spacing-4">
          <Text size="subtitle">None</Text>
          <Flex
            direction="column"
            padding="spacing-6"
            style={{
              background: "var(--color-bg-elevation-1)",
              borderRadius: "var(--border-radius-elevation-1)",
            }}
          >
            <Flex
              direction="column"
              padding="spacing-6"
              style={{
                background: "var(--color-bg-elevation-2)",
                borderRadius: "var(--border-radius-elevation-2)",
              }}
            >
              <Flex
                direction="column"
                padding="spacing-6"
                style={{
                  background: "var(--color-bg-elevation-3)",
                  borderRadius: "var(--border-radius-elevation-3)",
                }}
              >
                <Button>Do the Thing</Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
