package com.appsmith.external.models;

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

    String value;
    int startIndex;
    // A token can be with or without handlebars in the value. This boolean value represents the state of the current token.
    boolean includesHandleBars = false;
}
