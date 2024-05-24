package com.appsmith.server.helpers.ce.autocommit;

import lombok.Data;

@Data
public class AutoCommitTriggerDTO {

    private Boolean isAutoCommitRequired;

    private Boolean isClientAutoCommitRequired;

    private Boolean isServerAutoCommitRequired;
}
