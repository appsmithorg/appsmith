package com.appsmith.server.featureflags;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlagIdentities {
    String instanceId;
    String tenantId;
    Set<String> userEmails;
}