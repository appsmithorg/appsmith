package com.appsmith.util;

import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.core.util.Separators;
import org.springframework.stereotype.Component;

@Component
public class JSONPrettyPrinter extends DefaultPrettyPrinter {

    public JSONPrettyPrinter() {
        super();
        this._arrayIndenter = DefaultIndenter.SYSTEM_LINEFEED_INSTANCE;
        this._objectIndenter = DefaultIndenter.SYSTEM_LINEFEED_INSTANCE;
        this._objectEmptySeparator = "";
        this._arrayEmptySeparator = "";
        this._objectFieldValueSeparatorWithSpaces = _separators.getObjectFieldValueSeparator() + " ";
        this._separators = this._separators
                .withObjectFieldValueSpacing(Separators.Spacing.AFTER)
                .withObjectEmptySeparator("")
                .withArrayEmptySeparator("");
    }

    public JSONPrettyPrinter(DefaultPrettyPrinter base) {
        super(base);

        this._arrayIndenter = DefaultIndenter.SYSTEM_LINEFEED_INSTANCE;
        this._objectIndenter = DefaultIndenter.SYSTEM_LINEFEED_INSTANCE;
        this._objectEmptySeparator = "";
        this._arrayEmptySeparator = "";
        this._objectFieldValueSeparatorWithSpaces = _separators.getObjectFieldValueSeparator() + " ";
        this._separators = this._separators
                .withObjectFieldValueSpacing(Separators.Spacing.AFTER)
                .withObjectEmptySeparator("")
                .withArrayEmptySeparator("");
    }

    @Override
    public JSONPrettyPrinter createInstance() {
        if (getClass() != JSONPrettyPrinter.class) {
            throw new IllegalStateException(
                    "Failed `createInstance()`: " + getClass().getName() + " does not override method; it has to");
        }

        return new JSONPrettyPrinter(this);
    }
}
