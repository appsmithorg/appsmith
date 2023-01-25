package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class PluginParameterType {
    @JsonView(Views.Api.class)
    String key;
    @JsonView(Views.Api.class)
    String dataType;
}
