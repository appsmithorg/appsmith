# Security

## Does Appsmith store my data?

No, Appsmith does not store any data returned from your API endpoints or DB queries. Appsmith only acts as a proxy layer. When you query your database/API endpoint, the Appsmith server only appends sensitive credentials before forwarding the request to your backend. The Appsmith server doesn't expose sensitive credentials to the browser because that can lead to security breaches. Such a routing ensures security of your systems and data.
Security measures within Appsmith

### Appsmith applications are secure-by-default. The security measures implemented for Appsmith installations are:

•	On Appsmith Cloud, all connections are encrypted with TLS. For self-hosted instances, we offer
the capability to setup SSL certificates via LetsEncrypt during the installation process.

•	Encrypt all sensitive credentials such as database credentials with AES-256 encryption. 
Each self-hosted Appsmith instance is configured with unique salt and password values ensuring data-at-rest security.

•	Appsmith Cloud will only connect to your databases/API endpoints through whitelisted IPs: 18.223.74.85 & 3.131.104.27. 
This ensures that you only have to expose database access to specific IPs when using our cloud offering.

•	Appsmith Cloud is hosted in AWS data centers on servers that are SOC 1 and SOC 2 compliant. 
We also maintain data redundancy on our cloud instances via regular backups.

•	Internal access to Appsmith Cloud is controlled through 2-factor authentication system along with audit logs 
(audit logs here is in reference to Appsmith cloud hosted instance only and should not be confused with audit logs 
feature) .

•	Maintain an open channel of communication with security researchers to allow them to report security vulnerabilities responsibly. If you notice a security vulnerability, please email security@appsmith.com and we'll resolve them ASAP.

## What type of data security does appsmith provide?

Appsmith safely encrypts all your database credentials and stores them securely.

Appsmith also does not store any data returned from your data sources and acts only as a proxy layer to orchestrate the API / Query calls.

Appsmith is an open-source framework and can be fully audited and deployed on-premise to ensure none of your data leaves your VPC.


## Certifications

The Appsmiths is one of the four main business lines of Adreno Technologies India Pvt. Ltd and since the last 8 years,
we have been providing excellent web & mobile app solutions to clients from all over the world. Being an ISO 9001:2008 Certified Company,
Adreno Technologies along with its subsidiary Appsmiths,
has gained popularity primarily due to the quality of services we have delivered to our clients. With over 8+ years of experience in the IT industry,
we deliver excellence through a team of highly qualified and skilled professionals.
From startups to large scale enterprises, we have clients across 20+ countries worldwide and we feel proud to have delivered excellent quality work to them.
At TheAppSmiths, our success theory is simple–comfortable and professionally stimulating work environment! We enjoy our work and that helps us do it even better.
Our love for creativity and innovation is what differentiates us from other app development service providers and enables us to excel in what we do for our clients.

## Privacy Policy of Appsmith

Appsmith collects some Personal Data from its Users.

Users may be subject to different protection standards and broader standards may therefore apply to some. 
In order to learn more about the protection criteria, Users can refer to the applicability section.

This document contains a section dedicated to Californian consumers and their privacy rights.

This document can be printed for reference by using the print command in the settings of any browser.

### Legal basis of processing

The Owner may process Personal Data relating to Users if one of the following applies:

•	Users have given their consent for one or more specific purposes.
Note: Under some legislations the Owner may be allowed to process Personal Data until the User objects to such processing (“opt-out”),
without having to rely on consent or any other of the following legal bases. This, 
however, does not apply, whenever the processing of Personal Data is subject to European data protection law;

•	provision of Data is necessary for the performance of an agreement with the User and/or for any pre-contractual obligations thereof;
•	processing is necessary for compliance with a legal obligation to which the Owner is subject;
•	processing is related to a task that is carried out in the public interest or in the exercise of official authority vested in the Owner;
•	processing is necessary for the purposes of the legitimate interests pursued by the Owner or by a third party.

In any case, the Owner will gladly help to clarify the specific legal basis that applies to the processing, 
and in particular whether the provision of Personal Data is a statutory or contractual requirement, or a requirement necessary to enter into a contract.

## Product Overview

•	Appsmith is a JS-based internal tool development platform.
Internal tools take a lot of time to build even though they involve the same UI components, data integrations, and user access management. 
Developers love Appsmith because it saves them hundreds of hours.
•	Build interactive web apps by using UI components like a table, form components, button, charts, rich text editor, map, tabs, modal, and many more.
•	API Support: CURL importer for REST APIs Database Support: PostgreSQL, MongoDB, MySQL, Redshift, Elastic Search, DynamoDB, Redis, & MSFT SQL Server


The mobile experience is at the heart of everything we do here at Appsmith.
Users spend most of their time now - and that’s a reality which many industries have been slow to adapt to.
Our response is to create apps which don’t just perform better, or run faster, but redefine the use case, opening up new business opportunities and user relationships.
We identify where mobile users have been left behind, whether due to gaps in functionality, poor user experience or out of date design decisions.
We’re also excited by the product, not just the technology behind it.
We thrive on focusing in on the underlying need and developing innovative and creative ways to meet it.
From there we work towards a robust, reliable, and seamless solution, keeping the user experience in mind at every juncture.
That’s how we’re creating the mobile future. As well as our own app portfolio, 
we regularly undertake outsourced projects for a wide range of clients, which keeps us sharp and lends an added creative dimension to our in-house work.

## Troubleshooting

If at any time you encounter an error while installing Appsmith on any platform, reach out to support@appsmith.com or join our [Discord Server](https://discord.com/invite/rBTTVJp)
If you know the error and would like to reinstall Appsmith, simply delete the installation folder and the templates folder and execute the script again
