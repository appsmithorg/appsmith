CREATE DATABASE fakeapi;
\c fakeapi;

CREATE TABLE public.configs (
    id integer NOT NULL,
    "configName" text NOT NULL,
    "configJson" jsonb,
    "configVersion" integer,
    "updatedAt" timestamp with time zone,
    "updatedBy" text
);

CREATE SEQUENCE public.configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.configs_id_seq OWNER TO postgres;

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    status character varying,
    gender character varying,
    avatar character varying,
    email character varying,
    address text,
    role text,
    dob date,
    "phoneNo" text
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

insert into public.configs (id, "configName", "configJson", "configVersion", "updatedAt", "updatedBy") 
values (3,	'New Config',	'{"key": "val1"}',	1,	'2020-08-26 11:14:28.458209+00', ''), 
(5,	'New Config',	'{"key": "val2"}',	1,	'2020-08-26 11:14:28.458209+00', '');

insert into public.users (id, name, "createdAt", "updatedAt", status, gender, avatar, email, address, role, dob, "phoneNo") values 
(7, 'Test user 7', '2019-08-07 21:36:27+00', '2019-10-21 03:23:42+00', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', ''),
(8, 'Test user 8', '2019-08-07 21:36:27+00', '2019-10-21 03:23:42+00', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', ''),
(9, 'Test user 9', '2019-08-07 21:36:27+00', '2019-10-21 03:23:42+00', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', '');

