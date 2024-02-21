package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionMetricsDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class PageMetricsCE_DTO {

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String pageName;

    @JsonView(Views.Public.class)
    List<ActionMetricsDTO> actionMetricsDTOList;
}
