package com.appsmith.server.dtos;

import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.server.domains.Action;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class ExecuteActionDTO {

    @NotNull
    Action action;

    List<Param> params;

    PaginationField paginationField;
}
