package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JSFunction {

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String body;

    @JsonView(Views.Api.class)
    List<JSValue> arguments;
}
