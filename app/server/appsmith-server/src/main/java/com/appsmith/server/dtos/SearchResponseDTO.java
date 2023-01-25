package com.appsmith.server.dtos;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.external.models.Views;
import com.appsmith.server.domains.Action;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponseDTO {
    @JsonView(Views.Api.class)
    List<Provider> providers;

    @JsonView(Views.Api.class)
    List<ApiTemplate> apiTemplates;

    @JsonView(Views.Api.class)
    List<Action> actions;
}
