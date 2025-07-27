import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { config } from 'dotenv';
import { User, UserRole } from '../src/modules/user/user.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { Site } from '../src/modules/site/site.entity';
import { Comment } from '../src/modules/comment/comment.entity';
import { Reply } from '../src/modules/reply/reply.entity';
import { CommentView } from '../src/modules/comment/comment-view.entity';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'pinco',
  entities: [User, UserSite, Site, Comment, Reply, CommentView],
  synchronize: false,
});

async function seedAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Data source initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'denis.zagoruev@gmail.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await AppDataSource.destroy();
      return;
    }

    // Hash password
    const hashedPassword = await argon2.hash('admin');

    // Create admin user
    const adminUser = userRepository.create({
      email: 'denis.zagoruev@gmail.com',
      name: 'admin',
      username: 'admin',
      password: hashedPassword,
      active: true,
      roles: [UserRole.ADMIN],
      color: '#4F46E5', // Default purple color
    });

    await userRepository.save(adminUser);
    console.log('Admin user created successfully');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

void seedAdmin();
