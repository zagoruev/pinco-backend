import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import * as readline from 'readline';
import { DataSource } from 'typeorm';

import { CommentView } from '../src/modules/comment/comment-view.entity';
import { Comment } from '../src/modules/comment/comment.entity';
import { Reply } from '../src/modules/reply/reply.entity';
import { Site } from '../src/modules/site/site.entity';
import { UserSite } from '../src/modules/user/user-site.entity';
import { User, UserRole } from '../src/modules/user/user.entity';

config({ quiet: true });

// Create readline interface
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to prompt for password (hidden input)
function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Write the question
    stdout.write(question);

    let password = '';

    // We need to handle the input manually
    rl.close();

    // Store original settings and set raw mode
    const wasRaw = stdin.isRaw;

    if (!stdin.isTTY) {
      // If not a TTY, fall back to regular input
      const newRl = readline.createInterface({
        input: stdin,
        output: stdout,
        terminal: false,
      });

      newRl.question('', (answer) => {
        newRl.close();
        // Recreate the original readline interface
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        resolve(answer);
      });
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();

    const onData = (chunk: Buffer) => {
      const char = chunk[0];

      if (char === 3) {
        // Ctrl+C
        stdin.setRawMode(wasRaw || false);
        stdin.pause();
        stdout.write('\n');
        process.exit(1);
      } else if (char === 13 || char === 10) {
        // Enter
        stdin.setRawMode(wasRaw || false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');

        // Recreate the readline interface
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        resolve(password);
      } else if (char === 127 || char === 8) {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else if (char >= 32 && char <= 126) {
        // Printable character
        password += String.fromCharCode(char);
        stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

async function collectUserData() {
  console.log('=== Create Root User ===\n');

  let name: string;
  let username: string;
  let email: string;
  let password: string;

  // Get name
  do {
    name = await prompt('Enter full name: ');
    if (!name) {
      console.log('Name cannot be empty. Please try again.\n');
    }
  } while (!name);

  // Get username
  do {
    username = await prompt('Enter username: ');
    if (!username) {
      console.log('Username cannot be empty. Please try again.\n');
    } else if (username.length < 3) {
      console.log('Username must be at least 3 characters long. Please try again.\n');
      username = '';
    }
  } while (!username);

  // Get email
  do {
    email = await prompt('Enter email address: ');
    if (!email) {
      console.log('Email cannot be empty. Please try again.\n');
    } else if (!validateEmail(email)) {
      console.log('Invalid email format. Please try again.\n');
      email = '';
    }
  } while (!email);

  // Get password
  do {
    password = await promptPassword('Enter password: ');
    if (!password) {
      console.log('Password cannot be empty. Please try again.\n');
    } else if (password.length < 4) {
      console.log('Password must be at least 4 characters long. Please try again.\n');
      password = '';
    }
  } while (!password);

  // Confirm password
  let confirmPassword: string;
  do {
    confirmPassword = await promptPassword('Confirm password: ');
    if (password !== confirmPassword) {
      console.log('Passwords do not match. Please try again.\n');
    }
  } while (password !== confirmPassword);

  return { name, username, email, password };
}

async function seedRoot() {
  try {
    const userData = await collectUserData();

    console.log('\nConnecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected successfully.');

    const userRepository = AppDataSource.getRepository(User);

    // Check if user with this email already exists
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`\nError: User with email ${userData.email} already exists`);
      rl.close();
      await AppDataSource.destroy();
      return;
    }

    // Check if user with this username already exists
    const existingUsername = await userRepository.findOne({
      where: { username: userData.username },
    });

    if (existingUsername) {
      console.log(`\nError: User with username ${userData.username} already exists`);
      rl.close();
      await AppDataSource.destroy();
      return;
    }

    // Hash password
    console.log('\nHashing password...');
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create root user
    const rootUser = userRepository.create({
      email: userData.email,
      name: userData.name,
      username: userData.username,
      password: hashedPassword,
      active: true,
      roles: [UserRole.ROOT],
    });

    await userRepository.save(rootUser);

    console.log('\n✅ Root user created successfully!');
    console.log(`   Name: ${userData.name}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Email: ${userData.email}`);

    rl.close();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ Error seeding root user:', error);
    rl.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

void seedRoot();
