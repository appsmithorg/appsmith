package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import lombok.Data;

import java.util.List;

@Data
public class ActionUpdatesDTO {
    List<ActionDTO> added;
    List<ActionDTO> deleted;
    List<ActionDTO> updated;
}
