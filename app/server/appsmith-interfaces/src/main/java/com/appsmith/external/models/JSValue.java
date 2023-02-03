package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JSValue {

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String dataType;

    @JsonView(Views.Public.class)
    Object value;

    @JsonView(Views.Public.class)
    Boolean isValid;
}
