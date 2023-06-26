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
        EnumMap<FeatureFlagEnum, CurrentUserValidationContextProvider> featureFlagEnumMap = new EnumMap<>(FeatureFlagEnum.class);
        featureFlagEnumMap.put(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS, currentUserValidationContextProvider);
        featureFlagEnumMap.put(FeatureFlagEnum.MULTIPLE_PANES, currentUserValidationContextProvider);
        featureFlagEnumMap.put(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD, currentUserValidationContextProvider);
        featureFlagEnumMap.put(FeatureFlagEnum.APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY, currentUserValidationContextProvider);
        return new EnumMap<>(FeatureFlagEnum.class);
    }
}