package com.external.plugins.dynamodb.models;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
public class AttributeValue {
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html

    String b;  // Binary.

    Boolean bool;  // Boolean.

    Set<String> bs;  // Set of Binary.

    List<AttributeValue> l;  // List of AttributeValue objects.

    Map<String, AttributeValue> m;  // Map of String to AttributeValue objects.

    String n;  // Numeric. DynamoDB stores numeric data as strings.

    Set<String> ns;  // Set of Numeric.

    Boolean Null;  // Null indicator. Using capitalized name because `null` can't be used as a field in Java.

    String s;  // String.

    Set<String> ss;  // Set of String.

}
