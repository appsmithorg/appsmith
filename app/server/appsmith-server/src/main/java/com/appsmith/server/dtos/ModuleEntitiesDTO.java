package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import lombok.Data;
import lombok.ToString;

import java.util.List;

@ToString
@Data
public class ModuleEntitiesDTO {
    List<ActionDTO> actions;
    List<ActionCollectionDTO> jsCollections;
}
