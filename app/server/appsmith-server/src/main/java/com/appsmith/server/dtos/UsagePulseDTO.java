package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsagePulseDTO {
    String anonymousUserId;
    Boolean viewMode;
}
