package com.appsmith.external.interfaces;

import java.time.Instant;

public interface DeletableResource {
    Instant getDeletedAt();
}
