package com.appsmith.server.dtos;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.external.views.Views;
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
    @JsonView(Views.Public.class)
    List<Provider> providers;

    @JsonView(Views.Public.class)
    List<ApiTemplate> apiTemplates;

    @JsonView(Views.Public.class)
    List<Action> actions;
}
