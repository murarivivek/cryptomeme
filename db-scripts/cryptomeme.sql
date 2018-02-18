
CREATE DATABASE IF NOT EXISTS `cryptomeme`;
USE `cryptomeme`;

DROP TABLE IF EXISTS `meme_ownership`;
DROP TABLE IF EXISTS `ownership_transfer_log`;
DROP TABLE IF EXISTS `last_block_number`;
DROP TABLE IF EXISTS `meme`;
DROP TABLE IF EXISTS `user`;



CREATE TABLE `meme` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `image_url` varchar(1023) DEFAULT NULL,
  `base_price` decimal(50, 30) NOT NULL DEFAULT 0.001,
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
  PRIMARY KEY (`wallet_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE `meme_ownership` (
  `meme_id` bigint(20) NOT NULL,
  `wallet_address` varchar(255) NOT NULL,
  `price` decimal(50, 30) NOT NULL,
  `transactions_count` bigint(20) NOT NULL DEFAULT 0,
  `last_transaction_hash` varchar(255),
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_user` varchar(255) NOT NULL,
  `last_modified_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_user` varchar(255) NOT NULL,
  PRIMARY KEY (`meme_id`),
  KEY `user_fk_idx` (`wallet_address`),
  KEY `price_idx` (`price`),
  CONSTRAINT `ownership_meme_id_fk` FOREIGN KEY (`meme_id`) REFERENCES `meme` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `ownership_wallet_address_fk` FOREIGN KEY (`wallet_address`) REFERENCES `user` (`wallet_address`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




CREATE TABLE `ownership_transfer_log` (
  `transaction_hash` varchar(255) NOT NULL,
  `meme_id` bigint(20) NOT NULL,
  `from_address` varchar(255) NOT NULL,
  `to_address` varchar(255) NOT NULL,
  `block_number` bigint(20) NOT NULL,
  PRIMARY KEY (`transaction_hash`),
  KEY `meme_idx` (`meme_id`),
  KEY `from_address_idx` (`from_address`),
  KEY `to_address_idx` (`to_address`),
  CONSTRAINT `transfer_meme_id_fk` FOREIGN KEY (`meme_id`) REFERENCES `meme` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE `last_block_number` (
  `id` bigint(20) NOT NULL DEFAULT 0,
  `block_number` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into last_block_number (`id`, `block_number`) values (0,0);

--
/*

insert into meme (id, name, description, image_url, created_user, last_modified_user) values (0, 'Are You Kidding Me', '', 'images/are-you-kidding-me.jpeg','','');
insert into user (wallet_address, username, created_user, last_modified_user) values ('0x7ec1b0c977dfc18d3d0075fac0778f9799c8ff0b', 'pramod','','');
insert into meme_ownership (meme_id, wallet_address, price, created_user, last_modified_user) values (0,0,0.0001,'','');
select * from meme;
select * from user;
select * from meme_ownership;

*/