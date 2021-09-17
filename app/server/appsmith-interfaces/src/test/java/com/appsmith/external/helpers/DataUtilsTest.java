package com.appsmith.external.helpers;

import com.appsmith.external.models.ConditionalOperator;
import org.junit.Test;

import static com.appsmith.external.helpers.DataUtils.compareInteger;
import static org.junit.Assert.assertEquals;

public class DataUtilsTest {

    @Test
    public void checkIntegerEqComparison() {
        String source = "12";
        String destination = "14";

        ConditionalOperator op = ConditionalOperator.EQ;

        Boolean aBoolean = compareInteger(source, destination, op);

        assertEquals(aBoolean, Boolean.FALSE);
    }

    @Test
    public void checkIntegerInComparison() {
        String source = "1";
        String destination = "[\"0\",\"1\",\"2\",\"3\",\"4\"]";

        ConditionalOperator op = ConditionalOperator.IN;

        Boolean aBoolean = compareInteger(source, destination, op);

        assertEquals(aBoolean, Boolean.TRUE);
    }

    @Test
    public void checkIntegerNotInComparison() {
        String source = "1";
        String destination = "[\"0\",\"1\",\"2\",\"3\",\"4\"]";

        ConditionalOperator op = ConditionalOperator.NOT_IN;

        Boolean aBoolean = compareInteger(source, destination, op);

        assertEquals(aBoolean, Boolean.FALSE);
    }
}
