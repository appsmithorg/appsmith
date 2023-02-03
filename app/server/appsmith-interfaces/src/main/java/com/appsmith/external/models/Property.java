package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

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

    @JsonView(Views.Public.class)
    String key;

    @JsonView(Views.Public.class)
    Object value;

    @JsonView(Views.Public.class)
    Boolean editable;

    @JsonView(Views.Public.class)
    Boolean internal;

    @JsonView(Views.Public.class)
    String description;

    @JsonView(Views.Public.class)
    Boolean mandatory;

    @JsonView(Views.Public.class)
    String type;

    @JsonView(Views.Public.class)
    String defaultValue;

    @JsonView(Views.Public.class)
    String minRange;

    @JsonView(Views.Public.class)
    String maxRange;

    @JsonView(Views.Public.class)
    String[] valueOptions; // This stores the values that are permitted by the api for the given key

}
