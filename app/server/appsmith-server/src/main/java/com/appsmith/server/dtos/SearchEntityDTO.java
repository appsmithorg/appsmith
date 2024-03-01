package com.appsmith.server.dtos;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ce.SearchEntityCE_DTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SearchEntityDTO extends SearchEntityCE_DTO {
    List<Workflow> workflows;
}
