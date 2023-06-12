package com.appsmith.server.featureflags;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlagTrait {
    String identifier;
    String traitKey;
    String traitValue;
}