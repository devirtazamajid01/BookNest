import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      id: 'user',
      name: 'USER',
      description: 'Regular user with basic permissions',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      id: 'admin',
      name: 'ADMIN',
      description: 'Administrator with full permissions',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      roleId: 'admin',
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: await bcrypt.hash('user123', 10),
      name: 'Regular User',
      roleId: 'user',
    },
  });

  console.log('✓ Seeded roles:', userRole.name, adminRole.name);
  console.log('✓ Seeded admin:', adminUser.email);
  console.log('✓ Seeded user:', regularUser.email);

  const books = [
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      description:
        'A gripping tale of racial injustice and childhood innocence in the American South.',
      publishedAt: new Date('1960-07-11'),
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      description:
        'A dystopian social science fiction novel and cautionary tale about totalitarianism.',
      publishedAt: new Date('1949-06-08'),
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      description: 'A romantic novel of manners set in Georgian England.',
      publishedAt: new Date('1813-01-28'),
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      description:
        'A portrait of the Jazz Age in all of its decadence and excess.',
      publishedAt: new Date('1925-04-10'),
    },
    {
      title: 'Moby-Dick',
      author: 'Herman Melville',
      isbn: '978-0-14-243724-7',
      description:
        'The saga of Captain Ahab and his monomaniacal quest for revenge.',
      publishedAt: new Date('1851-10-18'),
    },
    {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0-316-76948-0',
      description: 'A story about teenage rebellion and alienation.',
      publishedAt: new Date('1951-07-16'),
    },
    {
      title: "Harry Potter and the Sorcerer's Stone",
      author: 'J.K. Rowling',
      isbn: '978-0-7475-3269-9',
      description:
        'A young wizard discovers his magical heritage on his eleventh birthday.',
      publishedAt: new Date('1997-06-26'),
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92822-7',
      description:
        'A fantasy adventure of Bilbo Baggins and his unexpected journey.',
      publishedAt: new Date('1937-09-21'),
    },
    {
      title: 'Brave New World',
      author: 'Aldous Huxley',
      isbn: '978-0-06-085052-4',
      description:
        'A dystopian novel set in a futuristic World State of genetically modified citizens.',
      publishedAt: new Date('1932-08-30'),
    },
    {
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      isbn: '978-0-544-00341-5',
      description:
        'An epic high-fantasy novel following the quest to destroy the One Ring.',
      publishedAt: new Date('1954-07-29'),
    },
    {
      title: 'Animal Farm',
      author: 'George Orwell',
      isbn: '978-0-452-28424-1',
      description:
        'A satirical allegory of Soviet totalitarianism and the corruption of ideals.',
      publishedAt: new Date('1945-08-17'),
    },
    {
      title: 'The Chronicles of Narnia',
      author: 'C.S. Lewis',
      isbn: '978-0-06-023481-4',
      description:
        'A series of fantasy novels about magical adventures in the land of Narnia.',
      publishedAt: new Date('1950-10-16'),
    },
    {
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      isbn: '978-0-14-144114-6',
      description:
        'A novel of intense emotion and moral strength following an orphaned governess.',
      publishedAt: new Date('1847-10-16'),
    },
    {
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      isbn: '978-0-14-143955-6',
      description: 'A tale of passion and revenge on the Yorkshire moors.',
      publishedAt: new Date('1847-12-19'),
    },
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '978-0-06-112241-5',
      description:
        'A philosophical story about a shepherd following his dreams to find treasure.',
      publishedAt: new Date('1988-01-01'),
    },
    {
      title: 'Crime and Punishment',
      author: 'Fyodor Dostoevsky',
      isbn: '978-0-14-044913-8',
      description:
        'A psychological thriller exploring morality, poverty, and redemption.',
      publishedAt: new Date('1866-01-01'),
    },
    {
      title: 'The Odyssey',
      author: 'Homer',
      isbn: '978-0-14-026886-7',
      description:
        "An ancient Greek epic poem about Odysseus's journey home after the Trojan War.",
      publishedAt: new Date('-800-01-01'),
    },
    {
      title: 'Fahrenheit 451',
      author: 'Ray Bradbury',
      isbn: '978-1-4516-7331-9',
      description:
        'A dystopian novel about a future society where books are outlawed and burned.',
      publishedAt: new Date('1953-10-19'),
    },
    {
      title: 'The Hunger Games',
      author: 'Suzanne Collins',
      isbn: '978-0-439-02348-1',
      description:
        'A dystopian novel about survival and sacrifice in a brutal televised competition.',
      publishedAt: new Date('2008-09-14'),
    },
    {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      isbn: '978-0-307-47572-4',
      description:
        'A mystery thriller involving art, religious symbology, and ancient secrets.',
      publishedAt: new Date('2003-03-18'),
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    });
  }

  console.log(`✓ Seeded ${books.length} books`);
  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('User:  user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
