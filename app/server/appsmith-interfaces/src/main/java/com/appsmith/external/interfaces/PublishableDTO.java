package com.appsmith.external.interfaces;

import java.time.Instant;

public interface PublishableDTO {
    String getName();
    Instant getDeletedAt();
}
