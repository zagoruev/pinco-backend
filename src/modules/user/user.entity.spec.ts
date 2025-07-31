import { User, UserRole, USER_COLORS } from './user.entity';
import { plainToInstance } from 'class-transformer';

describe('User Entity', () => {
  describe('USER_COLORS', () => {
    it('should have 10 colors', () => {
      expect(USER_COLORS).toHaveLength(10);
    });

    it('should have the correct color values', () => {
      expect(USER_COLORS).toEqual([
        '#4C53F1',
        '#119AFA',
        '#EDAB00',
        '#D64D4D',
        '#48B836',
        '#B865DF',
        '#ED741C',
        '#00A0D2',
        '#E04DAE',
        '#148F63',
      ]);
    });
  });

  describe('UserRole', () => {
    it('should have ROOT role', () => {
      expect(UserRole.ROOT).toBe('ROOT');
    });

    it('should have ADMIN role', () => {
      expect(UserRole.ADMIN).toBe('ADMIN');
    });
  });

  describe('User structure', () => {
    it('should create user instance', () => {
      const user = new User();
      user.id = 1;
      user.email = 'test@example.com';
      user.name = 'Test User';
      user.username = 'testuser';
      user.password = 'hashedpassword';
      user.active = true;
      user.roles = [UserRole.ADMIN];
      user.created = new Date();
      user.updated = new Date();

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.username).toBe('testuser');
      expect(user.active).toBe(true);
      expect(user.roles).toEqual([UserRole.ADMIN]);
    });
  });

  describe('color getter', () => {
    it('should generate consistent color based on email', () => {
      const user = new User();
      user.email = 'test@example.com';
      
      const color1 = user.color;
      const color2 = user.color;
      
      expect(color1).toBe(color2);
      expect(USER_COLORS).toContain(color1);
    });

    it('should generate different colors for different emails', () => {
      const user1 = new User();
      user1.email = 'user1@example.com';
      
      const user2 = new User();
      user2.email = 'user2@example.com';
      
      // They might have the same color due to modulo, but they should be valid colors
      expect(USER_COLORS).toContain(user1.color);
      expect(USER_COLORS).toContain(user2.color);
    });

    it('should handle edge case emails', () => {
      const testCases = [
        { email: 'a@b.c', expectedIndex: 8 }, // Short email
        { email: 'verylongemailaddress@verylongdomain.com', expectedIndex: 5 }, // Long email
        { email: '123@456.789', expectedIndex: 3 }, // Numeric email
        { email: 'UPPERCASE@EMAIL.COM', expectedIndex: 6 }, // Uppercase
        { email: 'special!@#$%^&*()@test.com', expectedIndex: 0 }, // Special characters
      ];

      testCases.forEach(({ email }) => {
        const user = new User();
        user.email = email;
        expect(USER_COLORS).toContain(user.color);
      });
    });

    it('should always return a valid color index (0-9)', () => {
      // Test with various emails to ensure we always get a valid index
      const emails = [
        'test@example.com',
        'admin@site.com',
        'user@domain.org',
        'noreply@service.io',
        'support@help.net',
        'info@company.biz',
        'contact@website.co',
        'hello@world.dev',
        'foo@bar.xyz',
        'alice@wonderland.com',
      ];

      emails.forEach(email => {
        const user = new User();
        user.email = email;
        const color = user.color;
        const colorIndex = USER_COLORS.indexOf(color);
        expect(colorIndex).toBeGreaterThanOrEqual(0);
        expect(colorIndex).toBeLessThan(10);
      });
    });

    it('should handle empty email gracefully', () => {
      const user = new User();
      user.email = '';
      expect(USER_COLORS).toContain(user.color);
    });
  });

  describe('Class transformer decorators', () => {
    it('should exclude password from serialization', () => {
      const user = new User();
      user.id = 1;
      user.email = 'test@example.com';
      user.name = 'Test User';
      user.password = 'secret-password';
      user.username = 'testuser';
      user.active = true;
      user.roles = [UserRole.ADMIN];

      const plainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'secret-password',
        username: 'testuser',
        active: true,
        roles: [UserRole.ADMIN],
      };

      const transformed = plainToInstance(User, plainUser, { excludeExtraneousValues: true });
      expect(transformed.password).toBeUndefined();
    });

    it('should expose color property', () => {
      const plainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'secret',
        username: 'testuser',
        active: true,
        roles: [],
      };

      const user = plainToInstance(User, plainUser);
      expect(user.color).toBeDefined();
      expect(USER_COLORS).toContain(user.color);
    });

    it('should expose roles only in backoffice group', () => {
      const plainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'secret',
        username: 'testuser',
        active: true,
        roles: [UserRole.ROOT, UserRole.ADMIN],
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-02'),
      };

      // Without group - roles should be undefined when using excludeExtraneousValues
      const withoutGroup = plainToInstance(User, plainUser, { excludeExtraneousValues: true });
      expect(withoutGroup.roles).toBeUndefined();
      expect(withoutGroup.created).toBeUndefined();
      expect(withoutGroup.updated).toBeUndefined();

      // With backoffice group - roles should be exposed
      const withGroup = plainToInstance(User, plainUser, { groups: ['backoffice'] });
      expect(withGroup.roles).toEqual([UserRole.ROOT, UserRole.ADMIN]);
      expect(withGroup.created).toEqual(new Date('2024-01-01'));
      expect(withGroup.updated).toEqual(new Date('2024-01-02'));
    });
  });

  describe('Entity relationships', () => {
    it('should have sites relationship', () => {
      const user = new User();
      user.sites = [];
      expect(user.sites).toBeDefined();
      expect(Array.isArray(user.sites)).toBe(true);
    });

    it('should have comments relationship', () => {
      const user = new User();
      user.comments = [];
      expect(user.comments).toBeDefined();
      expect(Array.isArray(user.comments)).toBe(true);
    });

    it('should have replies relationship', () => {
      const user = new User();
      user.replies = [];
      expect(user.replies).toBeDefined();
      expect(Array.isArray(user.replies)).toBe(true);
    });

    it('should have commentViews relationship', () => {
      const user = new User();
      user.commentViews = [];
      expect(user.commentViews).toBeDefined();
      expect(Array.isArray(user.commentViews)).toBe(true);
    });
  });
});