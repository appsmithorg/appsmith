package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDatasourceUsageDTO {

    private String applicationId;
    private String applicationName;
    private Integer queryCount;
    private List<PageDatasourceUsageDTO> pages;
}
