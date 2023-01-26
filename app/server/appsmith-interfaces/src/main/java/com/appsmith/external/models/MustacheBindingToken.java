package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@ToString
public class MustacheBindingToken {

    @JsonView(Views.Public.class)
    String value;

    @JsonView(Views.Public.class)
    int startIndex;

    // A token can be with or without handlebars in the value. This boolean value represents the state of the current token.
    @JsonView(Views.Public.class)
    boolean includesHandleBars = false;
}
