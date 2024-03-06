package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ApplicationResourcesDTO extends BaseView {
    private List<PageResourcesDTO> pages;
}
