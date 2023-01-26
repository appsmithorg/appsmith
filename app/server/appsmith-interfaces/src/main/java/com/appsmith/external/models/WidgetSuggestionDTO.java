package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class WidgetSuggestionDTO {

    @JsonView(Views.Public.class)
    WidgetType type;

    @JsonView(Views.Public.class)
    String bindingQuery;
}
