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
public class Statistics {
    @JsonView(Views.Public.class)
    Long imports; //No of times any of the provider's apis have been imported

    @JsonView(Views.Public.class)
    Long averageLatency; //Average latency of the APIs provided by this provider in milli second

    @JsonView(Views.Public.class)
    Double successRate; //Percentage of successful responses.
}
