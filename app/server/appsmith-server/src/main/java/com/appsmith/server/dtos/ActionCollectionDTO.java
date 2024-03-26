package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.ActionCollectionCE_DTO;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@NoArgsConstructor
@ToString(callSuper = true)
@QueryEmbeddable
@FieldNameConstants
public class ActionCollectionDTO extends ActionCollectionCE_DTO {
    public static class Fields extends ActionCollectionCE_DTO.Fields {}
}
