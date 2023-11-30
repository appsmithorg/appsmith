package com.appsmith.server.dtos;

import lombok.Data;
import lombok.ToString;

import java.util.List;

@ToString
@Data
public class ModuleInstanceEntitiesDTO {
    List<ActionViewDTO> actions;
    List<ActionCollectionDTO> jsCollections;
}
