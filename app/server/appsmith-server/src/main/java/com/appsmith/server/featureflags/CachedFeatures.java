package com.appsmith.server.featureflags;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CachedFeatures implements Serializable {
    Object currentFeatures;
    Object newFeatures;
    Instant refreshedAt;
}
