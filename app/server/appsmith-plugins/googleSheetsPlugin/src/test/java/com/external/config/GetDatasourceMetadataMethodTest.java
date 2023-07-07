package com.external.config;

import com.appsmith.external.models.Property;
import com.external.constants.FieldName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

public class GetDatasourceMetadataMethodTest {

    @Test
    public void verifyEmailStorageInPropertiesInDatasourceConfiguration() {
        List<Property> properties = new ArrayList<>();
        String emailAddress = "mockEmailAddress";
        List<Property> returnedProperties =
                GetDatasourceMetadataMethod.setPropertiesWithEmailAddress(properties, emailAddress);
        assert (!returnedProperties.isEmpty());
        assert (returnedProperties.get(0).getKey().equals(FieldName.EMAIL_ADDRESS));
        assert (returnedProperties.get(0).getValue().equals(emailAddress));
    }

    @Test
    public void verifyNewerEmailReplacesOldEmailInSamePropertyObject() {

        List<Property> properties = new ArrayList<>();
        Property oldEmailProperty = new Property(FieldName.EMAIL_ADDRESS, "oldEmailAddress");
        properties.add(oldEmailProperty);

        String emailAddress = "mockEmailAddress";
        List<Property> returnedProperties =
                GetDatasourceMetadataMethod.setPropertiesWithEmailAddress(properties, emailAddress);
        assert (!returnedProperties.isEmpty());
        assert (returnedProperties.size() == 1);
        assert (returnedProperties.get(0).getKey().equals(FieldName.EMAIL_ADDRESS));
        assert (returnedProperties.get(0).getValue().equals(emailAddress));
        assert (returnedProperties.get(0).equals(oldEmailProperty));
    }

    @Test
    public void verifyEmailPropertyReplacesOtherPropertyObjectAtZeroIndexInProperties() {
        List<Property> properties = new ArrayList<>();
        Property otherProperty = new Property("otherProperty", "random");
        properties.add(otherProperty);

        String emailAddress = "mockEmailAddress";
        List<Property> returnedProperties =
                GetDatasourceMetadataMethod.setPropertiesWithEmailAddress(properties, emailAddress);
        assert (!returnedProperties.isEmpty());
        assert (returnedProperties.size() == 1);
        assert (returnedProperties.get(0).getKey().equals(FieldName.EMAIL_ADDRESS));
        assert (returnedProperties.get(0).getValue().equals(emailAddress));
    }
}
