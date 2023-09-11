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
    String name;

    @JsonView(Views.Public.class)
    String defaultValue;
}
