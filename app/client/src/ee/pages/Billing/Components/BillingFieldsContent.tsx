import React from "react";
import { Text } from "design-system";
import type { BillingField } from "../Types/types";

export function BillingFieldsContent(props: { billingFields: BillingField[] }) {
  const { billingFields } = props;
  const billingData = billingFields.map((item: BillingField) => {
    return (
      item.value && (
        <div className="flex gap-8 mt-4" key={item.label}>
          <div className="w-40">
            <Text color="var(--ads-v2-color-fg)" kind="heading-xs">
              {item.label}:{" "}
            </Text>
          </div>
          <div>
            <Text data-testid={item.selector} kind="body-m">
              {item.value}
            </Text>
          </div>
        </div>
      )
    );
  });
  return <div>{billingData}</div>;
}
