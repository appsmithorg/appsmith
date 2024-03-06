package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class ModuleInput {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String label;

    @JsonView(Views.Public.class)
    String propertyName;

    @JsonView(Views.Public.class)
    String controlType;

    @JsonView(Views.Public.class)
    String defaultValue;
}
