package com.appsmith.server.featureflags.validationcontext;

public interface FeatureFlagValidationContextProvider<T> {
    T getFeatureFlagValidationContext();
}