package com.external.plugins;

import com.external.plugins.SoapXml.SoapVersion;
import org.w3c.dom.Element;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Reads the SOAP operations out of a WSDL 1.1 document.
 * shortcut: wsdl:import and WSDL 2.0 are not followed, upgrade when a real service needs them.
 */
final class WsdlParser {

    static final String WSDL_NS = "http://schemas.xmlsoap.org/wsdl/";
    static final String SOAP11_BINDING_NS = "http://schemas.xmlsoap.org/wsdl/soap/";
    static final String SOAP12_BINDING_NS = "http://schemas.xmlsoap.org/wsdl/soap12/";

    record SoapOperation(String port, String name, String endpoint, String soapAction, SoapVersion version) {
        String key() {
            return port + "/" + name;
        }

        SoapOperation withEndpoint(String newEndpoint) {
            return new SoapOperation(port, name, newEndpoint, soapAction, version);
        }
    }

    private record Binding(SoapVersion version, Map<String, String> soapActions) {}

    private WsdlParser() {}

    /** Operations keyed by {@link SoapOperation#key()}, in document order. Non-SOAP bindings are skipped. */
    static Map<String, SoapOperation> parse(byte[] wsdl) {
        Element definitions = SoapXml.parse(wsdl).getDocumentElement();
        if (!WSDL_NS.equals(definitions.getNamespaceURI()) || !"definitions".equals(SoapXml.localName(definitions))) {
            throw new IllegalArgumentException("Not a WSDL 1.1 document");
        }

        Map<String, Binding> bindings = new HashMap<>();
        for (Element binding : SoapXml.children(definitions, WSDL_NS, "binding")) {
            SoapVersion version = soapVersion(binding, "binding");
            if (version == null) {
                continue;
            }
            Map<String, String> soapActions = new LinkedHashMap<>();
            for (Element operation : SoapXml.children(binding, WSDL_NS, "operation")) {
                Element soapOperation = soapChild(operation, "operation");
                soapActions.put(
                        operation.getAttribute("name"),
                        soapOperation == null ? "" : soapOperation.getAttribute("soapAction"));
            }
            bindings.put(binding.getAttribute("name"), new Binding(version, soapActions));
        }

        Map<String, SoapOperation> operations = new LinkedHashMap<>();
        for (Element service : SoapXml.children(definitions, WSDL_NS, "service")) {
            for (Element port : SoapXml.children(service, WSDL_NS, "port")) {
                Binding binding = bindings.get(stripPrefix(port.getAttribute("binding")));
                Element address = soapChild(port, "address");
                if (binding == null || address == null) {
                    continue;
                }
                String portName = port.getAttribute("name");
                binding.soapActions().forEach((name, soapAction) -> {
                    SoapOperation operation = new SoapOperation(
                            portName, name, address.getAttribute("location"), soapAction, binding.version());
                    operations.put(operation.key(), operation);
                });
            }
        }
        return operations;
    }

    private static SoapVersion soapVersion(Element parent, String localName) {
        if (!SoapXml.children(parent, SOAP11_BINDING_NS, localName).isEmpty()) {
            return SoapVersion.SOAP_11;
        }
        if (!SoapXml.children(parent, SOAP12_BINDING_NS, localName).isEmpty()) {
            return SoapVersion.SOAP_12;
        }
        return null;
    }

    private static Element soapChild(Element parent, String localName) {
        for (String namespace : new String[] {SOAP11_BINDING_NS, SOAP12_BINDING_NS}) {
            var found = SoapXml.children(parent, namespace, localName);
            if (!found.isEmpty()) {
                return found.get(0);
            }
        }
        return null;
    }

    private static String stripPrefix(String qName) {
        return qName.substring(qName.indexOf(':') + 1);
    }
}
