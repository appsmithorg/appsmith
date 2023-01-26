package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OldProperty {

    @JsonView(Views.Public.class)
    String key;

    @JsonView(Views.Public.class)
    String value;

    @JsonView(Views.Public.class)
    Boolean editable;

    @JsonView(Views.Public.class)
    Boolean internal;
}
