package com.appsmith.external.models;

import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ParsedDataType {
    @JsonView(Views.Public.class)
    private final DisplayDataType dataType;
}
