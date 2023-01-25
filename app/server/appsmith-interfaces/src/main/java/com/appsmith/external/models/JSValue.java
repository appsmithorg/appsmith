package com.appsmith.external.models;

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

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String dataType;

    @JsonView(Views.Api.class)
    Object value;

    @JsonView(Views.Api.class)
    Boolean isValid;
}
