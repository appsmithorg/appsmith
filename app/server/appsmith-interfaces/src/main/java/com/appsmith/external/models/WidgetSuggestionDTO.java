package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class WidgetSuggestionDTO {

    WidgetType type;

    String bindingQuery;
}
