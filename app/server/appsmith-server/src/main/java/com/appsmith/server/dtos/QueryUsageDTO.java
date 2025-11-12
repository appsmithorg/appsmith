package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryUsageDTO {

    private String id;
    private String name;
    private String pageId;
    private String pageName;
    private String applicationId;
}
