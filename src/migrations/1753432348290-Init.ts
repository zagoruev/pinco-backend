import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1753432348290 implements MigrationInterface {
  name = 'Init1753432348290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE replies (
          id int NOT NULL AUTO_INCREMENT,
          comment_id int NOT NULL,
          user_id int NOT NULL,
          message text NOT NULL,
          created datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE comment_views (
          comment_id int NOT NULL,
          user_id int NOT NULL,
          viewed timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (comment_id, user_id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE comments (
          id int NOT NULL AUTO_INCREMENT,
          uniqid varchar(13) NOT NULL,
          message text NOT NULL,
          user_id int NOT NULL,
          site_id int NOT NULL,
          url varchar(2048) NOT NULL,
          reference json NULL,
          details json NULL,
          resolved tinyint NOT NULL DEFAULT 0,
          created datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          UNIQUE INDEX IDX_35652253cde554031dc7252587 (uniqid),
          PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE sites (
          id int NOT NULL AUTO_INCREMENT,
          name varchar(255) NOT NULL,
          license varchar(255) NOT NULL,
          domain varchar(255) NOT NULL,
          url varchar(255) NOT NULL,
          active tinyint NOT NULL DEFAULT 1,
          created datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id),
          UNIQUE INDEX IDX_4578b679503e1b86cc1c2531b9 (domain)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE user_sites (
          user_id int NOT NULL,
          site_id int NOT NULL,
          invite_code varchar(13) NULL,
          roles text NOT NULL DEFAULT '',
          created datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (user_id, site_id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE users (
          id int NOT NULL AUTO_INCREMENT,
          email varchar(255) NOT NULL,
          name varchar(255) NOT NULL,
          username varchar(255) NOT NULL,
          password varchar(255) NOT NULL,
          active tinyint NOT NULL DEFAULT 1,
          roles text NOT NULL DEFAULT '',
          created datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          UNIQUE INDEX IDX_97672ac88f789774dd47f7c8be (email),
          UNIQUE INDEX IDX_fe0bb3f6520ee0469504521e71 (username),
          PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE
          replies
          ADD CONSTRAINT FK_6a0cb640778c01be0d360c8f00d
          FOREIGN KEY (comment_id)
          REFERENCES comments(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          replies
          ADD CONSTRAINT FK_c961efa3687d100ed22cd409534
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          comment_views
          ADD CONSTRAINT FK_aa3f161b8938e32cb7fa966715e
          FOREIGN KEY (comment_id)
          REFERENCES comments(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          comment_views
          ADD CONSTRAINT FK_c084bc716f91a86ba4adcb72999
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          comments
          ADD CONSTRAINT FK_4c675567d2a58f0b07cef09c13d
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          comments
          ADD CONSTRAINT FK_66ed3a168ece7efea7a6ecd7712
          FOREIGN KEY (site_id)
          REFERENCES sites(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
          user_sites
          ADD CONSTRAINT FK_876af02663eefdbbd607c736346
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE
        user_sites
        ADD CONSTRAINT FK_76a7e1a212a3784b96140b713ba
        FOREIGN KEY (site_id)
        REFERENCES sites(id)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE user_sites DROP FOREIGN KEY FK_76a7e1a212a3784b96140b713ba');
    await queryRunner.query('ALTER TABLE user_sites DROP FOREIGN KEY FK_876af02663eefdbbd607c736346');
    await queryRunner.query('ALTER TABLE comments DROP FOREIGN KEY FK_66ed3a168ece7efea7a6ecd7712');
    await queryRunner.query('ALTER TABLE comments DROP FOREIGN KEY FK_4c675567d2a58f0b07cef09c13d');
    await queryRunner.query('ALTER TABLE comment_views DROP FOREIGN KEY FK_c084bc716f91a86ba4adcb72999');
    await queryRunner.query('ALTER TABLE comment_views DROP FOREIGN KEY FK_aa3f161b8938e32cb7fa966715e');
    await queryRunner.query('ALTER TABLE replies DROP FOREIGN KEY FK_c961efa3687d100ed22cd409534');
    await queryRunner.query('ALTER TABLE replies DROP FOREIGN KEY FK_6a0cb640778c01be0d360c8f00d');
    await queryRunner.query('DROP INDEX IDX_fe0bb3f6520ee0469504521e71 ON users');
    await queryRunner.query('DROP INDEX IDX_97672ac88f789774dd47f7c8be ON users');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE user_sites');
    await queryRunner.query('DROP INDEX IDX_4578b679503e1b86cc1c2531b9 ON sites');
    await queryRunner.query('DROP TABLE sites');
    await queryRunner.query('DROP INDEX IDX_35652253cde554031dc7252587 ON comments');
    await queryRunner.query('DROP TABLE comments');
    await queryRunner.query('DROP TABLE comment_views');
    await queryRunner.query('DROP TABLE replies');
  }
}
