package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ActionProvider {
    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String imageUrl;

    @JsonView(Views.Public.class)
    String url;

    @JsonView(Views.Public.class)
    String description;

    @JsonView(Views.Public.class)
    String credentialSteps;
}
