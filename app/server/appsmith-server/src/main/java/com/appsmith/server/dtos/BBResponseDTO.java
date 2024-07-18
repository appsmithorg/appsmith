package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
@FieldNameConstants
public class BBResponseDTO {
    BBMainDTO bb;
    List<ActionDTO> actionList;
    List<ActionCollectionDTO> actionCollectionList;
}
