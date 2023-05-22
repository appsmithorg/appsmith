/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.external.models.Provider;
import com.appsmith.server.domains.Action;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponseDTO {

  List<Provider> providers;
  List<ApiTemplate> apiTemplates;
  List<Action> actions;
}
