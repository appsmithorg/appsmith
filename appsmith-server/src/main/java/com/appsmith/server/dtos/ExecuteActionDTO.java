package com.appsmith.server.dtos;

import com.appsmith.external.models.Param;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class ExecuteActionDTO {

    @NotNull
    String actionId;

    List<Param> params;
}
