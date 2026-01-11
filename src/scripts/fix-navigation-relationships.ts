import { DataSource } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Navigation } from '../database/entities/navigation.entity';
import { Product } from '../database/entities/product.entity';

async function fixNavigationRelationships() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'product_explorer',
    entities: [Category, Navigation, Product],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const categoryRepository = dataSource.getRepository(Category);
  const navigationRepository = dataSource.getRepository(Navigation);

  const navigations = await navigationRepository.find();
  console.log('Available navigations:', navigations.map(n => ({ id: n.id, title: n.title, slug: n.slug })));

  const categoryNavigationMapping = {
    'Fiction': 2,
    'Romance': 2,
    'Mystery & Thriller': 2,
    'Science Fiction': 2,
    'Fantasy': 2,
    
    'Non-Fiction': 3,
    'Biography': 3,
    'History': 3,
    'Self-Help': 3,
    
    "Children's Books": 4,
  };

  for (const [categoryTitle, navigationId] of Object.entries(categoryNavigationMapping)) {
    const category = await categoryRepository.findOne({ where: { title: categoryTitle } });
    if (category) {
      category.navigationId = navigationId;
      await categoryRepository.save(category);
      console.log(`✓ Updated ${categoryTitle} -> Navigation ID ${navigationId}`);
    } else {
      console.log(`✗ Category not found: ${categoryTitle}`);
    }
  }

  console.log('\nVerifying changes:');
  const updatedCategories = await categoryRepository.find({ relations: ['navigation'] });
  for (const category of updatedCategories) {
    console.log(`${category.title} (${category.slug}) -> ${category.navigation?.title} (${category.navigation?.slug})`);
  }

  await dataSource.destroy();
  console.log('Database connection closed');
}

fixNavigationRelationships().catch(console.error);