package com.appsmith.external.models;

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

    @JsonView(Views.Api.class)
    String key;

    @JsonView(Views.Api.class)
    Object value;

    @JsonView(Views.Api.class)
    Boolean editable;

    @JsonView(Views.Api.class)
    Boolean internal;

    @JsonView(Views.Api.class)
    String description;

    @JsonView(Views.Api.class)
    Boolean mandatory;

    @JsonView(Views.Api.class)
    String type;

    @JsonView(Views.Api.class)
    String defaultValue;

    @JsonView(Views.Api.class)
    String minRange;

    @JsonView(Views.Api.class)
    String maxRange;

    @JsonView(Views.Api.class)
    String[] valueOptions; // This stores the values that are permitted by the api for the given key

}
