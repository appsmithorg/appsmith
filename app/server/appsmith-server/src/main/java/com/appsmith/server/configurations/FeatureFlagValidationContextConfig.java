package com.appsmith.server.configurations;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.featureflags.validationcontext.CurrentUserValidationContextProvider;
import com.appsmith.server.featureflags.validationcontext.FeatureFlagValidationContextProvider;
import java.util.EnumMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
public class FeatureFlagValidationContextConfig {

    @Autowired
    public CurrentUserValidationContextProvider currentUserValidationContextProvider;

    @Bean
    public Map<FeatureFlagEnum, FeatureFlagValidationContextProvider<?>> featureFlagEnumValidationContextMap() {
        return new EnumMap<>(FeatureFlagEnum.class);
    }
}