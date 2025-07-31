import { Comment } from '../../src/modules/comment/comment.entity';
import { Reply } from '../../src/modules/reply/reply.entity';
import { Site } from '../../src/modules/site/site.entity';
import { UserSite, UserSiteRole } from '../../src/modules/user/user-site.entity';
import { User, UserRole } from '../../src/modules/user/user.entity';

export class UserBuilder {
  private user: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed',
    active: true,
    roles: [],
    created: new Date(),
    updated: new Date(),
    sites: [],
    comments: [],
    replies: [],
    commentViews: [],
  };

  withId(id: number): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRoles(roles: UserRole[]): this {
    this.user.roles = roles;
    return this;
  }

  asAdmin(): this {
    this.user.roles = [UserRole.ADMIN];
    return this;
  }

  asRoot(): this {
    this.user.roles = [UserRole.ROOT];
    return this;
  }

  build(): User {
    return {
      ...this.user,
      get color() {
        return '#4C53F1';
      },
    } as User;
  }
}

export class SiteBuilder {
  private site: Partial<Site> = {
    id: 1,
    name: 'Test Site',
    license: 'LICENSE-123',
    url: 'https://test.com',
    domain: 'test.com',
    active: true,
    created: new Date(),
    updated: new Date(),
    userSites: [],
    comments: [],
  };

  withId(id: number): this {
    this.site.id = id;
    return this;
  }

  withDomain(domain: string): this {
    this.site.domain = domain;
    this.site.url = `https://${domain}`;
    return this;
  }

  inactive(): this {
    this.site.active = false;
    return this;
  }

  build(): Site {
    return this.site as Site;
  }
}

export class CommentBuilder {
  private comment: Partial<Comment> = {
    id: 1,
    uniqid: 'abc123def4567',
    message: 'Test comment',
    user_id: 1,
    site_id: 1,
    url: 'https://test.com/page',
    details: null,
    reference: null,
    resolved: false,
    screenshot: null,
    created: new Date(),
    updated: new Date(),
    replies: [],
    views: [],
  };

  withId(id: number): this {
    this.comment.id = id;
    return this;
  }

  withMessage(message: string): this {
    this.comment.message = message;
    return this;
  }

  withUser(user: User): this {
    this.comment.user = user;
    this.comment.user_id = user.id;
    return this;
  }

  withSite(site: Site): this {
    this.comment.site = site;
    this.comment.site_id = site.id;
    return this;
  }

  resolved(): this {
    this.comment.resolved = true;
    return this;
  }

  build(): Comment {
    return {
      ...this.comment,
      get viewed() {
        return this.views?.length ? this.views[0].viewed : null;
      },
    } as Comment;
  }
}

// Factory functions for quick creation
export const createUser = (overrides?: Partial<User>) => new UserBuilder().build();

export const createAdminUser = (overrides?: Partial<User>) => new UserBuilder().asAdmin().build();

export const createSite = (overrides?: Partial<Site>) => new SiteBuilder().build();

export const createComment = (overrides?: Partial<Comment>) => new CommentBuilder().build();
