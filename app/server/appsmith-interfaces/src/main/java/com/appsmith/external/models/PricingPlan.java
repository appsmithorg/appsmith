package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class PricingPlan {

    @JsonView(Views.Public.class)
    String name;
    @JsonView(Views.Public.class)
    Double pricePerMonthInUSD;
    @JsonView(Views.Public.class)
    Integer quotaPerMonth;
    @JsonView(Views.Public.class)
    String details;
}
