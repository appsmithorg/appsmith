package com.appsmith.caching.model;

import java.time.Instant;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TestModel extends ParentModel {
    private int intValue;
    private String stringValue;
    private Integer integerValue;
    private Boolean booleanValue;
    private Long longValue;
    private Double doubleValue;
    private NestedModel nestedModel;
    private String id;
}
