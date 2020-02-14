package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Property {

    String key;

    String value;

    Boolean editable;

    Boolean internal;

    String description;

    Boolean mandatory;

    String type;

    String defaultValue;

    String minRange;

    String maxRange;

}
