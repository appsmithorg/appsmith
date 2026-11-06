package com.external.plugins;

import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** XML helpers for WSDL parsing, envelope construction and response conversion. */
final class SoapXml {

    private static final String XMLNS_NS = "http://www.w3.org/2000/xmlns/";
    private static final String XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";

    enum SoapVersion {
        SOAP_11("http://schemas.xmlsoap.org/soap/envelope/", "text/xml; charset=utf-8"),
        SOAP_12("http://www.w3.org/2003/05/soap-envelope", "application/soap+xml; charset=utf-8");

        final String envelopeNamespace;
        final String contentType;

        SoapVersion(String envelopeNamespace, String contentType) {
            this.envelopeNamespace = envelopeNamespace;
            this.contentType = contentType;
        }
    }

    private SoapXml() {}

    static Document parse(byte[] xml) {
        try {
            return newBuilder().parse(new ByteArrayInputStream(xml));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage(), e);
        }
    }

    static Document parse(String xml) {
        try {
            return newBuilder().parse(new InputSource(new StringReader(xml)));
        } catch (Exception e) {
            throw new IllegalArgumentException(e.getMessage(), e);
        }
    }

    /** A parser with DOCTYPEs, external entities and XInclude disabled, so untrusted XML cannot trigger XXE. */
    private static DocumentBuilder newBuilder() throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        // The default handler prints parse errors to stderr before throwing.
        builder.setErrorHandler(new ErrorHandler() {
            public void warning(SAXParseException e) {}

            public void error(SAXParseException e) throws SAXParseException {
                throw e;
            }

            public void fatalError(SAXParseException e) throws SAXParseException {
                throw e;
            }
        });
        return builder;
    }

    /**
     * The request envelope. A body that is already a complete envelope (e.g. pasted from SoapUI) is sent as-is;
     * otherwise the header and body are wrapped. Throws IllegalArgumentException when the result is not well-formed.
     */
    static String envelope(SoapVersion version, String header, String body) {
        String trimmedBody = body == null ? "" : body.strip().replaceFirst("^<\\?xml[^>]*\\?>", "");
        try {
            if ("Envelope".equals(localName(parse(trimmedBody).getDocumentElement()))) {
                return trimmedBody;
            }
        } catch (IllegalArgumentException ignored) {
            // Not a single well-formed document, so treat it as Body content.
        }

        String envelope = "<soap:Envelope xmlns:soap=\"" + version.envelopeNamespace + "\">"
                + (header == null || header.isBlank() ? "" : "<soap:Header>" + header + "</soap:Header>")
                + "<soap:Body>" + trimmedBody + "</soap:Body></soap:Envelope>";
        parse(envelope);
        return envelope;
    }

    /** The first element inside the response's Body, or null for an empty Body. */
    static Element bodyContent(byte[] response) {
        Element root = parse(response).getDocumentElement();
        if (!"Envelope".equals(localName(root))) {
            throw new IllegalArgumentException("Response is not a SOAP envelope");
        }
        Element body = firstChild(root, "Body");
        if (body == null) {
            throw new IllegalArgumentException("SOAP envelope has no Body");
        }
        return firstChild(body, null);
    }

    static boolean isFault(Element element) {
        return element != null && "Fault".equals(localName(element));
    }

    /** faultstring for SOAP 1.1, Reason/Text for SOAP 1.2. */
    static String faultMessage(Element fault) {
        NodeList faultString = fault.getElementsByTagNameNS("*", "faultstring");
        if (faultString.getLength() > 0) {
            return faultString.item(0).getTextContent().strip();
        }
        NodeList reasonText = fault.getElementsByTagNameNS("*", "Text");
        if (reasonText.getLength() > 0) {
            return reasonText.item(0).getTextContent().strip();
        }
        return "SOAP fault";
    }

    /**
     * Converts an element to JSON-friendly values keyed by local name: a leaf becomes its text, repeated children
     * become a list, attributes become keys, and xsi:nil="true" becomes null.
     */
    static Object toValue(Element element) {
        Map<String, Object> map = new LinkedHashMap<>();
        NamedNodeMap attributes = element.getAttributes();
        for (int i = 0; i < attributes.getLength(); i++) {
            Attr attr = (Attr) attributes.item(i);
            if (XMLNS_NS.equals(attr.getNamespaceURI())) {
                continue;
            }
            if (XSI_NS.equals(attr.getNamespaceURI())) {
                if ("nil".equals(localName(attr)) && "true".equals(attr.getValue())) {
                    return null;
                }
                continue;
            }
            map.put(localName(attr), attr.getValue());
        }

        StringBuilder text = new StringBuilder();
        boolean hasChildElements = false;
        for (Node child = element.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child instanceof Element childElement) {
                hasChildElements = true;
                put(map, localName(childElement), toValue(childElement));
            } else if (child.getNodeType() == Node.TEXT_NODE || child.getNodeType() == Node.CDATA_SECTION_NODE) {
                text.append(child.getNodeValue());
            }
        }

        if (!hasChildElements && map.isEmpty()) {
            return text.toString();
        }
        if (!text.toString().isBlank()) {
            map.put("#text", text.toString().strip());
        }
        return map;
    }

    @SuppressWarnings("unchecked")
    private static void put(Map<String, Object> map, String key, Object value) {
        if (!map.containsKey(key)) {
            map.put(key, value);
            return;
        }
        Object existing = map.get(key);
        if (existing instanceof List<?> list) {
            ((List<Object>) list).add(value);
        } else {
            List<Object> list = new ArrayList<>();
            list.add(existing);
            list.add(value);
            map.put(key, list);
        }
    }

    /** First child element, with the given local name when it is not null. */
    static Element firstChild(Element parent, String localName) {
        for (Node child = parent.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child instanceof Element element && (localName == null || localName.equals(localName(element)))) {
                return element;
            }
        }
        return null;
    }

    static List<Element> children(Element parent, String namespace, String localName) {
        List<Element> result = new ArrayList<>();
        for (Node child = parent.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child instanceof Element element
                    && localName.equals(localName(element))
                    && (namespace == null || namespace.equals(element.getNamespaceURI()))) {
                result.add(element);
            }
        }
        return result;
    }

    static String localName(Node node) {
        return node.getLocalName() != null ? node.getLocalName() : node.getNodeName();
    }
}
