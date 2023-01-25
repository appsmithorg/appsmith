package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OldProperty {

    @JsonView(Views.Api.class)
    String key;

    @JsonView(Views.Api.class)
    String value;

    @JsonView(Views.Api.class)
    Boolean editable;

    @JsonView(Views.Api.class)
    Boolean internal;
}
