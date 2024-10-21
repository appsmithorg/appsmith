package com.appsmith.server.dtos;

/**
 * This class is used to store information about a field in a class. It stores the full path of the field and the type
 * of the field.
 * e.g. If we have a class with the following structure:
 * class A {
 *    Field1 field1;
 *    Field2 field2;
 * }
 * class Field1 {
 *   String field3;
 *   Boolean field4;
 * }
 * This will result in the following FieldInfo objects:
 * field3 => FieldInfo("field1.field3", String.class)
 * field4 => FieldInfo("field1.field4", Boolean.class)
 * @param fullPath
 * @param type
 */
public record FieldInfo(String fullPath, Class<?> type) {}
