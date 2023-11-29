package com.appsmith.server.validations;

import org.springframework.stereotype.Service;

@Service
public class EntityValidationServiceImpl extends EntityValidationServiceCEImpl implements EntityValidationService {

    @Override
    public boolean validateName(String name, Boolean isInternal) {
        if (Boolean.TRUE.equals(isInternal)) {
            String pattern = "^((?=[A-Za-z0-9_$])(?![\\\\-]).)*$";
            return this.validateNameWithPattern(name, pattern);
        } else return super.validateName(name, isInternal);
    }
}
