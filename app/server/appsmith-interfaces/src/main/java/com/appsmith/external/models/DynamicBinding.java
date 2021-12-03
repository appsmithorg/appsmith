package com.appsmith.external.models;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class DynamicBinding {
    String binding;
    Boolean isFunctionCall;

    public static Map<String, DynamicBinding> create(String bindingCandidate) {
        Map<String, DynamicBinding> dynamicBindings = new HashMap<>();


        final String[] splitBindings = bindingCandidate.split("\\.");

        if (splitBindings.length < 2) {
            // This could be a reference to an action but doesn't use its data
            // Do not trigger the action unnecessarily
            // Example: Api1 or btoa
            return dynamicBindings;
        } else if (splitBindings.length == 2 && "data".equals(splitBindings[1])) {
            // This is a normal action data reference
            // Example: Api1.data
            DynamicBinding dynamicBinding = new DynamicBinding();
            dynamicBinding.binding = splitBindings[0];
            dynamicBinding.isFunctionCall = false;
            dynamicBindings.put(dynamicBinding.binding, dynamicBinding);
        } else if (splitBindings.length == 2) {
            // If this is a reference to an action, it is only valid if it belongs to a collection
            // These won't be called on page load for js, but will still be traversed for dependencies
            // Example: Collection1.action1
            // Note: Here, if something like Api1.run gets caught, it won't match an action name,
            // and hence won't be marked for run on page load
            DynamicBinding dynamicBinding = new DynamicBinding();
            dynamicBinding.binding = bindingCandidate;
            dynamicBinding.isFunctionCall = true;
            dynamicBindings.put(dynamicBinding.binding, dynamicBinding);
        } else if ("data".equals(splitBindings[1])) {
            // This could be a normal action data reference with references to objects within it
            // Example: Api1.data.fileData...
            DynamicBinding dynamicBinding = new DynamicBinding();
            dynamicBinding.binding = splitBindings[0];
            dynamicBinding.isFunctionCall = false;
            dynamicBindings.put(dynamicBinding.binding, dynamicBinding);

            // This could be a collection action data reference, with or without more references
            // Example: Collection1.data.action1...
            dynamicBinding = new DynamicBinding();
            dynamicBinding.binding = splitBindings[0] + "." + splitBindings[2];
            dynamicBinding.isFunctionCall = false;
            dynamicBindings.put(dynamicBinding.binding, dynamicBinding);
        }

        return dynamicBindings;
    }
}
