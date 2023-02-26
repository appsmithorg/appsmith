package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class PricingPlan {
    String name;
    Double pricePerMonthInUSD;
    Integer quotaPerMonth;
    String details;
}
