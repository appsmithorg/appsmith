package com.appsmith.external.services.ce;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ArrayType;
import com.appsmith.external.datatypes.BooleanType;
import com.appsmith.external.datatypes.DateType;
import com.appsmith.external.datatypes.DoubleType;
import com.appsmith.external.datatypes.FloatType;
import com.appsmith.external.datatypes.IntegerType;
import com.appsmith.external.datatypes.JsonObjectType;
import com.appsmith.external.datatypes.LongType;
import com.appsmith.external.datatypes.NullType;
import com.appsmith.external.datatypes.StringType;
import com.appsmith.external.datatypes.TimeType;
import com.appsmith.external.datatypes.TimestampType;

import java.util.List;

public class DatatypeServiceCEImpl implements DatatypeServiceCE {

    final List<AppsmithType> defaultTypesList;

    public DatatypeServiceCEImpl() {

        this.defaultTypesList = List.of(
                new NullType(),
                new ArrayType(),
                new IntegerType(),
                new LongType(),
                new FloatType(),
                new DoubleType(),
                new BooleanType(),
                new TimestampType(),
                new DateType(),
                new TimeType(),
                new JsonObjectType(),
                new StringType()
        );
    }

    @Override
    public AppsmithType getAppsmithType(String originalValue, List<AppsmithType> possibleTypes) {
        for (AppsmithType currentType : possibleTypes) {
            if (currentType.test(originalValue)) {
                return currentType;
            }
        }
        // We should ideally never get here
        return null;
    }

    @Override
    public AppsmithType getAppsmithType(String originalValue) {
        return this.getAppsmithType(originalValue, this.defaultTypesList);
    }
}
