package com.appsmith.server.dtos;

import com.appsmith.server.domains.CustomJSLib;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class CustomJSLibDTO {
    String applicationId;
    CustomJSLib jsLib;
}
