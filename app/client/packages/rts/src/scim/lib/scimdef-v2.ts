//==================================
// File:    scimdef.ts
//
// Author:  Jarle Elshaug
//==================================

module.exports.ServiceProviderConfigs = {
  schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
  patch: {
    supported: true,
  },
  bulk: {
    supported: false,
    maxPayloadSize: 1048576,
    maxOperations: 1000,
  },
  filter: {
    supported: true,
    maxResults: 200,
  },
  changePassword: {
    supported: true,
  },
  sort: {
    supported: false,
  },
  etag: {
    supported: false,
  },
  documentationUri: "https://elshaug.xyz",
  authenticationSchemes: [
    {
      type: "httpbasic",
      name: "HTTP Basic",
      description: "Authentication scheme using the HTTP Basic Standard",
      specURI: "http://www.rfc-editor.org/info/rfc2617",
      documentationUri: "https://elshaug.xyz",
      primary: true,
    },
    {
      type: "oauthbearertoken",
      name: "OAuth Bearer Token",
      description:
        "Authentication scheme using the OAuth Bearer Token Standard",
      specUri: "http://www.rfc-editor.org/info/rfc6750",
      documentationUri: "https://elshaug.xyz",
    },
    {
      type: "oauth2",
      name: "OAuth v2.0",
      description: "Authentication Scheme using the OAuth Standard",
      specUri: "http://tools.ietf.org/html/rfc6749",
      documentationUri: "https://elshaug.xyz",
    },
  ],
  xmlDataFormat: { supported: false },
};

module.exports.ResourceType = {
  totalResults: 2,
  itemsPerPage: 2,
  startIndex: 1,
  schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  Resources: [
    {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
      id: "urn:ietf:params:scim:schemas:core:2.0:User",
      name: "User",
      endpoint: "/Users",
      description: "User Account",
      schema: "urn:ietf:params:scim:schemas:core:2.0:User",
      schemaExtensions: [
        {
          schema: "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
          required: false,
        },
      ],
      meta: {
        resourceType: "ResourceType",
        location: "/Schemas/urn:ietf:params:scim:schemas:core:2.0:User",
      },
    },
    {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
      id: "urn:ietf:params:scim:schemas:core:2.0:Group",
      name: "Group",
      endpoint: "/Groups",
      description: "Group",
      schema: "urn:ietf:params:scim:schemas:core:2.0:Group",
      meta: {
        resourceType: "Schema",
        location: "/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group",
      },
    },
  ],
};

module.exports.Schemas = {
  Resources: [
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:User",
      name: "User",
      description: "User Account",
      attributes: [
        {
          name: "userName",
          type: "string",
          multiValued: false,
          description:
            "Unique identifier for the User typically usedby the user to directly authenticate to the service provider. Each User MUST include a non-empty userName value.  This identifier MUST be unique across the Service Consumer's entire set of Users.  REQUIRED",
          required: true,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "server",
        },
        {
          name: "displayName",
          type: "string",
          multiValued: false,
          description:
            "The name of the User, suitable for display to end-users. The name SHOULD be the full name of the User being described if known",
          required: false,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "active",
          type: "boolean",
          multiValued: false,
          description:
            "A Boolean value indicating the User's administrative status.",
          required: false,
          mutability: "readWrite",
          returned: "default",
        },
      ],
      meta: {
        resourceType: "Schema",
        location: "/Schemas/urn:ietf:params:scim:schemas:core:2.0:User",
      },
    },
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:Group",
      name: "Group",
      description: "Group",
      attributes: [
        {
          name: "displayName",
          type: "string",
          multiValued: false,
          description: "Human readable name for the Group. REQUIRED.",
          required: true,
          caseExact: false,
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "description",
          type: "string",
          description:
            "The description of the Group, suitable for display to end-users.",
          mutability: "readWrite",
          returned: "default",
          uniqueness: "none",
          multiValued: false,
          required: false,
          caseExact: false,
        },
        {
          name: "members",
          type: "complex",
          multiValued: true,
          description: "A list of members of the Group.",
          required: false,
          subAttributes: [
            {
              name: "value",
              type: "string",
              multiValued: false,
              description: "Identifier of the member of this Group.",
              required: false,
              caseExact: false,
              mutability: "immutable",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "$ref",
              type: "reference",
              referenceTypes: ["User", "Group"],
              multiValued: false,
              description:
                "The URI of the corresponding to the memberre source of this Group.",
              required: false,
              caseExact: false,
              mutability: "immutable",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "type",
              type: "string",
              multiValued: false,
              description:
                "A label indicating the type of resource; e.g., 'User' or 'Group'.",
              required: false,
              caseExact: false,
              canonicalValues: ["User", "Group"],
              mutability: "immutable",
              returned: "default",
              uniqueness: "none",
            },
          ],
          mutability: "readWrite",
          returned: "default",
        },
      ],
      meta: {
        resourceType: "Schema",
        location: "/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group",
      },
    },
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
      name: "Service Provider Configuration",
      description:
        "Schema for representing the service provider's configuration",
      attributes: [
        {
          name: "documentationUri",
          type: "reference",
          referenceTypes: ["external"],
          multiValued: false,
          description:
            "An HTTP addressable URL pointing to the service provider's human consumable help documentation.",
          required: false,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "patch",
          type: "complex",
          multiValued: false,
          description:
            "A complex type that specifies PATCH configuration options.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "supported",
              type: "boolean",
              multiValued: false,
              description:
                "Boolean value specifying whether the operation is supported.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
          ],
        },
        {
          name: "bulk",
          type: "complex",
          multiValued: false,
          description:
            "A complex type that specifies BULK configuration options.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "supported",
              type: "boolean",
              multiValued: false,
              description:
                "Boolean value specifying whether the operation is supported.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
            {
              name: "maxOperations",
              type: "integer",
              multiValued: false,
              description:
                "An integer value specifying the maximum number of operations.",
              required: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "maxPayloadSize",
              type: "integer",
              multiValued: false,
              description:
                "An integer value specifying the maximum payload size in bytes.",
              required: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
          ],
        },
        {
          name: "filter",
          type: "complex",
          multiValued: false,
          description: "A complex type that specifies FILTER options.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "supported",
              type: "boolean",
              multiValued: false,
              description:
                "Boolean value specifying whether the operation is supported.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
            {
              name: "maxResults",
              type: "integer",
              multiValued: false,
              description:
                "Integer value specifying the maximum number of resources returned in a response.",
              required: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
          ],
        },
        {
          name: "changePassword",
          type: "complex",
          multiValued: false,
          description: "A complex type that specifies change password options.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "supported",
              type: "boolean",
              multiValued: false,
              description:
                "Boolean value specifying whether the operation is supported.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
          ],
        },
        {
          name: "sort",
          type: "complex",
          multiValued: false,
          description: "A complex type that specifies sort result options.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "supported",
              type: "boolean",
              multiValued: false,
              description:
                "Boolean value specifying whether the operation is supported.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
          ],
        },
        {
          name: "authenticationSchemes",
          type: "complex",
          multiValued: true,
          description:
            "A complex type that specifies supported Authentication Scheme properties.",
          required: true,
          returned: "default",
          mutability: "readOnly",
          subAttributes: [
            {
              name: "name",
              type: "string",
              multiValued: false,
              description:
                "The common authentication scheme name; e.g., HTTP Basic.",
              required: true,
              caseExact: false,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "description",
              type: "string",
              multiValued: false,
              description: "A description of the authentication scheme.",
              required: true,
              caseExact: false,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "specUri",
              type: "reference",
              referenceTypes: ["external"],
              multiValued: false,
              description:
                "An HTTP addressable URL pointing to the Authentication Scheme's specification.",
              required: false,
              caseExact: false,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "documentationUri",
              type: "reference",
              referenceTypes: ["external"],
              multiValued: false,
              description:
                "An HTTP addressable URL pointing to the Authentication Scheme's usage documentation.",
              required: false,
              caseExact: false,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
          ],
        },
      ],
    },
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:ResourceType",
      name: "ResourceType",
      description: "Specifies the schema that describes a SCIM Resource Type",
      attributes: [
        {
          name: "id",
          type: "string",
          multiValued: false,
          description:
            "The resource type's server unique id. May be the same as the 'name' attribute.",
          required: false,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "name",
          type: "string",
          multiValued: false,
          description:
            "The resource type name. When applicable service providers MUST specify the name specified in the core schema specification; e.g., User",
          required: true,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "description",
          type: "string",
          multiValued: false,
          description:
            "The resource type's human readable description. When applicable service providers MUST specify the description specified in the core schema specification.",
          required: false,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "endpoint",
          type: "reference",
          referenceTypes: ["uri"],
          multiValued: false,
          description:
            "The resource type's HTTP addressable endpoint relative to the Base URL; e.g., /Users",
          required: true,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "schema",
          type: "reference",
          referenceTypes: ["uri"],
          multiValued: false,
          description: "The resource types primary/base schema URI",
          required: true,
          caseExact: true,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "schemaExtensions",
          type: "complex",
          multiValued: false,
          description:
            "A list of URIs of the resource type's schema extensions",
          required: true,
          mutability: "readOnly",
          returned: "default",
          subAttributes: [
            {
              name: "schema",
              type: "reference",
              referenceTypes: ["uri"],
              multiValued: false,
              description: "The URI of a schema extension.",
              required: true,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "required",
              type: "boolean",
              multiValued: false,
              description:
                "A Boolean value that specifies whether the schema extension is required for the resource type. If true, a resource of this type MUST include this schema extension and include any attributes declared as required in this schema extension. If false, a resource of this type MAY omit this schema extension.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
          ],
        },
      ],
    },
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:Schema",
      name: "Schema",
      description: "Specifies the schema that describes a SCIM Schema",
      attributes: [
        {
          name: "id",
          type: "string",
          multiValued: false,
          description:
            "The unique URI of the schema. When applicable service providers MUST specify the URI specified in the core schema specification",
          required: true,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "name",
          type: "string",
          multiValued: false,
          description:
            "The schema's human readable name. When applicable service providers MUST specify the name specified in the core schema specification; e.g., User",
          required: true,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "description",
          type: "string",
          multiValued: false,
          description:
            "The schema's human readable name. When applicable service providers MUST specify the name specified in the core schema specification; e.g., User",
          required: false,
          caseExact: false,
          mutability: "readOnly",
          returned: "default",
          uniqueness: "none",
        },
        {
          name: "attributes",
          type: "complex",
          multiValued: true,
          description:
            "A complex attribute that includes the attributes of a schema",
          required: true,
          mutability: "readOnly",
          returned: "default",
          subAttributes: [
            {
              name: "name",
              type: "string",
              multiValued: false,
              description: "The attribute's name",
              required: true,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "type",
              type: "string",
              multiValued: false,
              description:
                "The attribute's data type. Valid values include: 'string', 'complex', 'boolean', 'decimal', 'integer', 'dateTime', 'reference'. ",
              required: true,
              canonicalValues: [
                "string",
                "complex",
                "boolean",
                "decimal",
                "integer",
                "dateTime",
                "reference",
              ],
              caseExact: false,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "multiValued",
              type: "boolean",
              multiValued: false,
              description: "Boolean indicating an attribute's plurality.",
              required: true,
              mutability: "readOnly",
              returned: "default",
            },
            {
              name: "description",
              type: "string",
              multiValued: false,
              description: "A human readable description of the attribute.",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "required",
              type: "boolean",
              multiValued: false,
              description: "A boolean indicating if the attribute is required.",
              required: false,
              mutability: "readOnly",
              returned: "default",
            },
            {
              name: "canonicalValues",
              type: "string",
              multiValued: true,
              description:
                "A collection of canonical values.  When applicable service providers MUST specify the canonical types specified in the core schema specification; e.g., 'work', 'home'.",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "caseExact",
              type: "boolean",
              multiValued: false,
              description: "Indicates if a string attribute is case-sensitive.",
              required: false,
              mutability: "readOnly",
              returned: "default",
            },
            {
              name: "mutability",
              type: "string",
              multiValued: false,
              description: "Indicates if an attribute is modifiable.",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
              canonicalValues: [
                "readOnly",
                "readWrite",
                "immutable",
                "writeOnly",
              ],
            },
            {
              name: "returned",
              type: "string",
              multiValued: false,
              description:
                "Indicates when an attribute is returned in a response (e.g., to a query).",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
              canonicalValues: ["always", "never", "default", "request"],
            },
            {
              name: "uniqueness",
              type: "string",
              multiValued: false,
              description: "Indicates how unique a value must be.",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
              canonicalValues: ["none", "server", "global"],
            },
            {
              name: "referenceTypes",
              type: "string",
              multiValued: true,
              description:
                "Used only with an attribute of type 'reference'. Specifies a SCIM resourceType that a reference attribute MAY refer to. e.g., User",
              required: false,
              caseExact: true,
              mutability: "readOnly",
              returned: "default",
              uniqueness: "none",
            },
            {
              name: "subAttributes",
              type: "complex",
              multiValued: true,
              description:
                "Used to define the sub-attributes of a complex attribute",
              required: false,
              mutability: "readOnly",
              returned: "default",
              subAttributes: [
                {
                  name: "name",
                  type: "string",
                  multiValued: false,
                  description: "The attribute's name",
                  required: true,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                },
                {
                  name: "type",
                  type: "string",
                  multiValued: false,
                  description:
                    "The attribute's data type. Valid values include: 'string', 'complex', 'boolean', 'decimal', 'integer', 'dateTime', 'reference'. ",
                  required: true,
                  caseExact: false,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                  canonicalValues: [
                    "string",
                    "complex",
                    "boolean",
                    "decimal",
                    "integer",
                    "dateTime",
                    "reference",
                  ],
                },
                {
                  name: "multiValued",
                  type: "boolean",
                  multiValued: false,
                  description: "Boolean indicating an attribute's plurality.",
                  required: true,
                  mutability: "readOnly",
                  returned: "default",
                },
                {
                  name: "description",
                  type: "string",
                  multiValued: false,
                  description: "A human readable description of the attribute.",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                },
                {
                  name: "required",
                  type: "boolean",
                  multiValued: false,
                  description:
                    "A boolean indicating if the attribute is required.",
                  required: false,
                  mutability: "readOnly",
                  returned: "default",
                },
                {
                  name: "canonicalValues",
                  type: "string",
                  multiValued: true,
                  description:
                    "A collection of canonical values.  When applicable service providers MUST specify the canonical types specified in the core schema specification; e.g., 'work', 'home'.",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                },
                {
                  name: "caseExact",
                  type: "boolean",
                  multiValued: false,
                  description:
                    "Indicates if a string attribute is case-sensitive.",
                  required: false,
                  mutability: "readOnly",
                  returned: "default",
                },
                {
                  name: "mutability",
                  type: "string",
                  multiValued: false,
                  description: "Indicates if an attribute is modifiable.",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                  canonicalValues: [
                    "readOnly",
                    "readWrite",
                    "immutable",
                    "writeOnly",
                  ],
                },
                {
                  name: "returned",
                  type: "string",
                  multiValued: false,
                  description:
                    "Indicates when an attribute is returned in a response (e.g., to a query).",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                  canonicalValues: ["always", "never", "default", "request"],
                },
                {
                  name: "uniqueness",
                  type: "string",
                  multiValued: false,
                  description: "Indicates how unique a value must be.",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                  canonicalValues: ["none", "server", "global"],
                },
                {
                  name: "referenceTypes",
                  type: "string",
                  multiValued: false,
                  description:
                    "Used only with an attribute of type 'reference'. Specifies a SCIM resourceType that a reference attribute MAY refer to. e.g., 'User'",
                  required: false,
                  caseExact: true,
                  mutability: "readOnly",
                  returned: "default",
                  uniqueness: "none",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

//========================================================//
//======= Dummy testdata used for testmode plugin  =======//
//========================================================//

module.exports.TestmodeUsers = {
  Resources: [
    {
      id: "bjensen",
      externalId: "bjensen",
      userName: "bjensen",
      name: {
        formatted: "Ms. Barbara J Jensen, III",
        familyName: "Jensen",
        givenName: "Barbara",
        middleName: "Jane",
        honorificPrefix: "Ms.",
        honorificSuffix: "III",
      },
      displayName: "Babs Jensen",
      nickName: "Babs",
      profileUrl: "https://login.example.com/bjensen",
      emails: [
        {
          value: "bjensen@example.com",
          type: "work",
          primary: true,
        },
        {
          value: "babs@jensen.org",
          type: "home",
        },
      ],
      addresses: [
        {
          streetAddress: "100 Universal City Plaza",
          locality: "Hollywood",
          region: "CA",
          postalCode: "91608",
          country: "USA",
          formatted: "100 Universal City Plaza\nHollywood, CA 91608 USA",
          type: "work",
          primary: true,
        },
        {
          streetAddress: "456 Hollywood Blvd",
          locality: "Hollywood",
          region: "CA",
          postalCode: "91608",
          country: "USA",
          formatted: "456 Hollywood Blvd\nHollywood, CA 91608 USA",
          type: "home",
        },
      ],
      phoneNumbers: [
        {
          value: "555-555-5555",
          type: "work",
        },
        {
          value: "555-555-4444",
          type: "mobile",
        },
      ],
      roles: [
        {
          value: "Role-A",
        },
      ],
      ims: [
        {
          value: "someaimhandle",
          type: "aim",
        },
      ],
      photos: [
        {
          value: "https://photos.example.com/profilephoto/72930000000Ccne/F",
          type: "photo",
        },
        {
          value: "https://photos.example.com/profilephoto/72930000000Ccne/T",
          type: "thumbnail",
        },
      ],
      entitlements: [
        {
          value: "bjensen entitlement",
          type: "newentitlement",
        },
      ],
      userType: "Employee",
      title: "Tour Guide",
      preferredLanguage: "en-US",
      locale: "en-US",
      timezone: "America/Los_Angeles",
      active: true,
      password: "t1meMa$heen",
      x509Certificates: [
        {
          value: "MIIDQzCCAqy...",
        },
      ],
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
        employeeNumber: "701984",
        costCenter: "4130",
        organization: "Universal Studios",
        division: "Theme Park",
        department: "Tour Operations",
        manager: {
          value: "jsmith",
          $ref: "../Users/jsmith",
          displayName: "John Smith",
        },
      },
      meta: {
        resourceType: "User",
        created: "2010-01-23T04:56:22Z",
        lastModified: "2011-05-13T04:42:34Z",
        version: 'W/"3694e05e9dff591"',
        location: "https://example.com/v2/Users/bjensen",
      },
    },
    {
      id: "jsmith",
      externalId: "jsmith",
      userName: "jsmith",
      name: {
        formatted: "Mr. John Smith",
        familyName: "Smith",
        givenName: "John",
        middleName: "",
        honorificPrefix: "Mr.",
        honorificSuffix: "III",
      },
      displayName: "John Smith",
      nickName: "JohnS",
      profileUrl: "https://login.example.com/johns",
      emails: [
        {
          value: "jsmith@example.com",
          type: "work",
          primary: true,
        },
        {
          value: "john@smith.org",
          type: "home",
        },
      ],
      addresses: [
        {
          streetAddress: "100 Universal City Plaza",
          locality: "Hollywood",
          region: "CA",
          postalCode: "91608",
          country: "USA",
          formatted: "100 Universal City Plaza\nHollywood, CA 91608 USA",
          type: "work",
          primary: true,
        },
        {
          streetAddress: "987 Highstreet",
          locality: "New York",
          region: "CA",
          postalCode: "12345",
          country: "USA",
          formatted: "987 Highstreet\nNew York, CA 12345 USA",
          type: "home",
        },
      ],
      phoneNumbers: [
        {
          value: "555-555-1256",
          type: "work",
        },
        {
          value: "555-555-6521",
          type: "mobile",
        },
      ],
      ims: [
        {
          value: "anything",
          type: "aim",
        },
      ],
      roles: [
        {
          value: "Role-B",
        },
      ],
      photos: [
        {
          value: "https://photos.example.com/profilephoto/12340000000Ccne/F",
          type: "photo",
        },
        {
          value: "https://photos.example.com/profilephoto/12340000000Ccne/T",
          type: "thumbnail",
        },
      ],
      entitlements: [
        {
          value: "jsmith entitlement",
          type: "newentitlement",
        },
      ],
      userType: "Employee",
      title: "Consultant",
      preferredLanguage: "en-US",
      locale: "en-US",
      timezone: "America/Los_Angeles",
      active: true,
      password: "MySecret",
      x509Certificates: [
        {
          value: "MIIDQzCCAqy...",
        },
      ],
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
        employeeNumber: "991999",
        costCenter: "4188",
        organization: "Universal Studios",
        division: "Theme Park",
        department: "Tour Operations",
        manager: {
          value: "bjensen",
          displayName: "Babs Jensen",
        },
      },
      meta: {
        resourceType: "User",
        created: "2016-01-23T04:56:22Z",
        lastModified: "2016-05-13T04:42:34Z",
        version: 'W/"3694e05e9dff591"',
        location: "https://example.com/v2/Users/jsmith",
      },
    },
  ],
};

module.exports.TestmodeGroups = {
  Resources: [
    {
      displayName: "Admins",
      id: "Admins",
      members: [
        {
          value: "bjensen",
          display: "Babs Jensen",
        },
      ],
      meta: {
        resourceType: "Group",
        created: "2010-01-23T04:56:22Z",
        lastModified: "2011-05-13T04:42:34Z",
        location: "https://example.com/v2/Groups/Admins",
        version: 'W/"3694e05e9dff592"',
      },
    },
    {
      displayName: "Employees",
      id: "Employees",
      members: [
        {
          value: "jsmith",
          display: "John Smith",
        },
      ],
      meta: {
        resourceType: "Group",
        created: "2010-01-23T04:56:22Z",
        lastModified: "2011-05-13T04:42:34Z",
        location: "https://example.com/v2/Groups/Employees",
        version: 'W/"3694e05e9dff592"',
      },
    },
  ],
};
