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

    @JsonView(Views.Api.class)
    String name;
    @JsonView(Views.Api.class)
    Double pricePerMonthInUSD;
    @JsonView(Views.Api.class)
    Integer quotaPerMonth;
    @JsonView(Views.Api.class)
    String details;
}
