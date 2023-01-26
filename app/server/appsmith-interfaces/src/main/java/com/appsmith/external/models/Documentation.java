package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Documentation {
    @JsonView(Views.Public.class)
    String text;
    @JsonView(Views.Public.class)
    String url;
}
