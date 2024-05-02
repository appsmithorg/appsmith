package com.appsmith.external.models;

import com.appsmith.external.markers.TransientAware;
import com.appsmith.external.models.ce.ActionCE_DTO;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@FieldNameConstants
public class ActionDTO extends ActionCE_DTO implements TransientAware {
    public static class Fields extends ActionCE_DTO.Fields {}
}
