package com.appsmith.external.helpers;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithEventContext {
    private final AppsmithEventContextType appsmithEventContextType;
    private final Object[] args;

    public AppsmithEventContext(AppsmithEventContextType appsmithEventContextType, Object... args) {
        this.appsmithEventContextType = appsmithEventContextType;
        this.args = args;
    }
}
