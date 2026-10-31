package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.PageNameIdDTOCE;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@ToString(callSuper = true)
@FieldNameConstants
public class PageNameIdDTO extends PageNameIdDTOCE {
    public static class Fields extends PageNameIdDTOCE.Fields {}
}
