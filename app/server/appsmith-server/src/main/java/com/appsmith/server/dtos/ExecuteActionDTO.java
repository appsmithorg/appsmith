package com.appsmith.server.dtos;

import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.server.domains.Action;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExecuteActionDTO {

    /**
     * action field was added to support dry run execution. Now that dry run functionality has been removed,
     * actionId has been added to send only the id of the action.
     * TODO : Remove the deprecated field.
     */
    @Deprecated
    Action action;

    String actionId;

    List<Param> params;

    PaginationField paginationField;

    Boolean viewMode = false;
}
