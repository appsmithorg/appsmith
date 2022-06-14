package com.appsmith.external.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

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

    // TODO: remove it.
    /*@Transient
    Object limit;
    public void setLimit(Object val) {
        this.value = val;
    }*/

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
