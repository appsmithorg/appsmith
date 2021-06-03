package com.appsmith.external.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class Property {

    /*
     * A convenience constructor to create a Property object with just a key and a value.
     */
    public Property(String key, Object value) {
        this.key = key;
        this.value = value;
    }

    String key;

    Object value;

    Boolean editable;

    Boolean internal;

    String description;

    Boolean mandatory;

    String type;

    String defaultValue;

    String minRange;

    String maxRange;

    String[] valueOptions; // This stores the values that are permitted by the api for the given key

}
