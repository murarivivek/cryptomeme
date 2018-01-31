
CREATE DATABASE IF NOT EXISTS `cryptomeme`;
USE `cryptomeme`;

DROP TABLE IF EXISTS `meme_ownership`;
DROP TABLE IF EXISTS `meme`;
DROP TABLE IF EXISTS `user`;


CREATE TABLE `meme` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(1023) DEFAULT NULL,
  `image_url` varchar(1023) DEFAULT NULL,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_user` varchar(255) NOT NULL,
  `last_modified_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_user` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE `user` (
  `wallet_address` varchar(255) NOT NULL,
  `username` varchar(1023) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_user` varchar(255) NOT NULL,
  `last_modified_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_user` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`wallet_address`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE `meme_ownership` (
  `meme_id` bigint(20) NOT NULL,
  `wallet_address` varchar(255) NOT NULL,
  `price` decimal(50, 6) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_user` varchar(255) NOT NULL,
  `last_modified_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_user` varchar(255) NOT NULL,
  PRIMARY KEY (`meme_id`),
  KEY `user_fk_idx` (`wallet_address`),
  KEY `price_idx` (`price`),
  CONSTRAINT `meme_id_fk` FOREIGN KEY (`meme_id`) REFERENCES `meme` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `wallet_address_fk` FOREIGN KEY (`wallet_address`) REFERENCES `user` (`wallet_address`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
/*

insert into meme (id, name, description, image_url, created_user, last_modified_user) values (0, 'Are You Kidding Me', '', 'images/are-you-kidding-me.jpeg','','');
insert into user (wallet_address, username, created_user, last_modified_user) values ('0x7ec1b0c977dfc18d3d0075fac0778f9799c8ff0b', 'pramod','','');
insert into meme_ownership (meme_id, wallet_address, price, created_user, last_modified_user) values (0,0,0.0001,'','');
select * from meme;
select * from user;
select * from meme_ownership;

*/