package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitDeployKeyDTO {
    String protocolName;

    String platFormSupported;

    int keySize;
}
