package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ModuleInput {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String defaultValue;

    // We will look for dynamic bindings only in the `value` field of the module input
    @JsonView(Views.Public.class)
    String value;
}
