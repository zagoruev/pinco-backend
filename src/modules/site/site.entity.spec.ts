import { Site } from './site.entity';

describe('Site Entity', () => {
  it('should be defined', () => {
    expect(Site).toBeDefined();
  });

  it('should create a site instance', () => {
    const site = new Site();
    site.id = 1;
    site.name = 'Test Site';
    site.license = 'LICENSE-123';
    site.domain = 'example.com';
    site.active = true;
    site.created = new Date();
    site.updated = new Date();

    expect(site.id).toBe(1);
    expect(site.name).toBe('Test Site');
    expect(site.license).toBe('LICENSE-123');
    expect(site.domain).toBe('example.com');
    expect(site.active).toBe(true);
    expect(site.created).toBeInstanceOf(Date);
    expect(site.updated).toBeInstanceOf(Date);
  });
});