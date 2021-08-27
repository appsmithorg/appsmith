CREATE DATABASE fakeapi;
use fakeapi;

CREATE TABLE configs (
    id int NOT NULL AUTO_INCREMENT,
    configName varchar(255) NOT NULL,
    configJson JSON,
    configVersion int ,
    updatedAt TIMESTAMP,
    updatedBy varchar(255),
  primary key (id)
);

CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255),
    createdAt datetime,
    updatedAt datetime,
    status varchar(255),
    gender varchar(255),
    avatar varchar(255),
    email varchar(255),
    address varchar(255),
    role varchar(255),
    dob date,
    phoneNo varchar(255),
  primary key (id)
);


insert into configs (id, configName, configJson, configVersion, updatedAt, updatedBy)
values (3, 'New Config', '{"key": "val1"}', 1, '2020-08-26 11:14:28', ''),
(5, 'New Config', '{"key": "val2"}', 1, '2020-08-26 11:14:28', '');


insert into users (id, name, createdAt, updatedAt, status, gender, avatar, email, address, role, dob, phoneNo) values
(7, 'Test user 7', '2019-08-07 21:36:27', '2019-10-21 03:23:42', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', ''),
(8, 'Test user 8', '2019-08-07 21:36:27', '2019-10-21 03:23:42', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', ''),
(9, 'Test user 9', '2019-08-07 21:36:27', '2019-10-21 03:23:42', 'APPROVED', 'Male', 'https://robohash.org/quiofficiadicta.jpg?size=100x100&set=set1' ,'xkainz6@ihg.com', '19624 Scofield Way', 'Admin','1993-08-14', '');

