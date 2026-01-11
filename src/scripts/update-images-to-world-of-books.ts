import { DataSource } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { Category } from '../database/entities/category.entity';
import { Navigation } from '../database/entities/navigation.entity';
import { ProductDetail } from '../database/entities/product-detail.entity';
import { Review } from '../database/entities/review.entity';
import { ScrapeJob } from '../database/entities/scrape-job.entity';
import { ViewHistory } from '../database/entities/view-history.entity';

const generateWorldOfBooksImageUrl = (sourceId: string, isbn?: string): string => {
  const cleanSourceId = sourceId.replace(/[^a-zA-Z0-9]/g, '');
  
  const patterns = [
    `https://images.worldofbooks.com/book/${cleanSourceId}.jpg`,
    `https://cdn.worldofbooks.com/images/${cleanSourceId}_medium.jpg`,
    `https://static.worldofbooks.com/covers/${cleanSourceId}.jpg`,
    `https://media.worldofbooks.com/book-covers/${cleanSourceId}.jpg`,
  ];
  
  return patterns[0];
};

async function updateImagesToWorldOfBooks() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'product_explorer',
    entities: [Product, Category, Navigation, ProductDetail, Review, ScrapeJob, ViewHistory],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const productRepository = dataSource.getRepository(Product);

  const products = await productRepository.find({ relations: ['detail'] });
  console.log(`Found ${products.length} products to update`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    if (product.imageUrl && product.imageUrl.includes('worldofbooks.com')) {
      skippedCount++;
      continue;
    }

    const newImageUrl = generateWorldOfBooksImageUrl(
      product.sourceId, 
      product.detail?.isbn
    );

    product.imageUrl = newImageUrl;
    await productRepository.save(product);
    
    updatedCount++;
    
    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount} products...`);
    }
  }

  console.log(`\n Update completed:`);
  console.log(`- Updated: ${updatedCount} products`);
  console.log(`- Skipped: ${skippedCount} products (already World of Books)`);
  console.log(`- Total: ${products.length} products`);

  await dataSource.destroy();
  console.log('Database connection closed');
}

updateImagesToWorldOfBooks().catch(console.error);