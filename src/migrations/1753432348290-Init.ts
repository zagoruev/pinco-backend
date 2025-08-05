import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1753432348290 implements MigrationInterface {
  name = 'Init1753432348290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('ROOT', 'ADMIN')`);
    await queryRunner.query(`CREATE TYPE "user_site_role_enum" AS ENUM('ADMIN', 'COLLABORATOR')`);

    await queryRunner.query(
      `CREATE TABLE replies (
          id SERIAL PRIMARY KEY,
          comment_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE comment_views (
          comment_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          viewed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (comment_id, user_id)
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE comments (
          id SERIAL PRIMARY KEY,
          uniqid VARCHAR(13) NOT NULL,
          message TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          site_id INTEGER NOT NULL,
          url VARCHAR(2048) NOT NULL,
          reference JSON NULL,
          details JSON NULL,
          resolved BOOLEAN NOT NULL DEFAULT false,
          created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_35652253cde554031dc7252587 ON comments (uniqid)`);
    await queryRunner.query(
      `CREATE TABLE sites (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          license VARCHAR(255) NOT NULL,
          domain VARCHAR(255) NOT NULL,
          url VARCHAR(255) NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_4578b679503e1b86cc1c2531b9 ON sites (domain)`);
    await queryRunner.query(
      `CREATE TABLE user_sites (
          user_id INTEGER NOT NULL,
          site_id INTEGER NOT NULL,
          invite_code VARCHAR(13) NULL,
          roles user_site_role_enum[] NOT NULL DEFAULT '{}',
          created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, site_id)
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          roles user_role_enum[] NOT NULL DEFAULT '{}',
          created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_97672ac88f789774dd47f7c8be ON users (email)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_fe0bb3f6520ee0469504521e71 ON users (username)`);
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
    await queryRunner.query('ALTER TABLE user_sites DROP CONSTRAINT FK_76a7e1a212a3784b96140b713ba');
    await queryRunner.query('ALTER TABLE user_sites DROP CONSTRAINT FK_876af02663eefdbbd607c736346');
    await queryRunner.query('ALTER TABLE comments DROP CONSTRAINT FK_66ed3a168ece7efea7a6ecd7712');
    await queryRunner.query('ALTER TABLE comments DROP CONSTRAINT FK_4c675567d2a58f0b07cef09c13d');
    await queryRunner.query('ALTER TABLE comment_views DROP CONSTRAINT FK_c084bc716f91a86ba4adcb72999');
    await queryRunner.query('ALTER TABLE comment_views DROP CONSTRAINT FK_aa3f161b8938e32cb7fa966715e');
    await queryRunner.query('ALTER TABLE replies DROP CONSTRAINT FK_c961efa3687d100ed22cd409534');
    await queryRunner.query('ALTER TABLE replies DROP CONSTRAINT FK_6a0cb640778c01be0d360c8f00d');
    await queryRunner.query('DROP INDEX IDX_fe0bb3f6520ee0469504521e71');
    await queryRunner.query('DROP INDEX IDX_97672ac88f789774dd47f7c8be');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE user_sites');
    await queryRunner.query('DROP INDEX IDX_4578b679503e1b86cc1c2531b9');
    await queryRunner.query('DROP TABLE sites');
    await queryRunner.query('DROP INDEX IDX_35652253cde554031dc7252587');
    await queryRunner.query('DROP TABLE comments');
    await queryRunner.query('DROP TABLE comment_views');
    await queryRunner.query('DROP TABLE replies');
    await queryRunner.query('DROP TYPE "user_site_role_enum"');
    await queryRunner.query('DROP TYPE "user_role_enum"');
  }
}
