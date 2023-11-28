package com.appsmith.server.validations;

import org.springframework.stereotype.Service;

import javax.lang.model.SourceVersion;

@Service
public class EntityValidationServiceCEImpl implements EntityValidationServiceCE {

    @Override
    public boolean validateName(String name, Boolean isInternal) {
        String pattern = "^((?=[A-Za-z0-9_])(?![\\\\-]).)*$";
        return this.validateNameWithPattern(name, pattern);
    }

    protected boolean validateNameWithPattern(String name, String pattern) {
        boolean isValidName = SourceVersion.isName(name);
        boolean doesPatternMatch = name.matches(pattern);
        return isValidName && doesPatternMatch;
    }
}
