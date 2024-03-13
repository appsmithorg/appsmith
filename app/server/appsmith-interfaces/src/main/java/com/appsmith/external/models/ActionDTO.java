package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
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
public class ActionDTO extends ActionCE_DTO {
    public static class Fields extends ActionCE_DTO.Fields {}
}
