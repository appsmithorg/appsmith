package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.PageDTOCE;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@ToString(callSuper = true)
@FieldNameConstants
public class PageDTO extends PageDTOCE {
    public static class Fields extends PageDTOCE.Fields {}
}
