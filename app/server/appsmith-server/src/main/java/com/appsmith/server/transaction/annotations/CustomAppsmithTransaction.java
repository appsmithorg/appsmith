package com.appsmith.server.transaction.annotations;

import com.appsmith.external.constants.TransactionPropagation;

public @interface CustomAppsmithTransaction {
    TransactionPropagation propagation() default TransactionPropagation.REQUIRED;
}
