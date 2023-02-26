package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class Statistics {
    Long imports; //No of times any of the provider's apis have been imported
    Long averageLatency; //Average latency of the APIs provided by this provider in milli second
    Double successRate; //Percentage of successful responses.
}
