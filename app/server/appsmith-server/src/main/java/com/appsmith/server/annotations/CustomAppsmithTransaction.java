package com.appsmith.server.annotations;

import com.appsmith.external.constants.TransactionPropagation;

public @interface CustomAppsmithTransaction {
    TransactionPropagation propagation() default TransactionPropagation.REQUIRED;
}
