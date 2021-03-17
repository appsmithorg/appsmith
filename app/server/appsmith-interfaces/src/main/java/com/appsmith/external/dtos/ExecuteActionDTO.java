package com.appsmith.external.dtos;

import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExecuteActionDTO {

    String actionId;

    List<Param> params;

    PaginationField paginationField;

    Boolean viewMode = false;
}
