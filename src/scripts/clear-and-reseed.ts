import { AppDataSource } from '../database/data-source';
import { Product } from '../database/entities/product.entity';
import { ProductDetail } from '../database/entities/product-detail.entity';
import { Review } from '../database/entities/review.entity';
import { seedLargeDataset } from './seed-large-dataset';

async function clearAndReseed() {
  console.log(' Clearing existing product data...');
  
  try {
    await AppDataSource.initialize();
    
    const productRepo = AppDataSource.getRepository(Product);
    const productDetailRepo = AppDataSource.getRepository(ProductDetail);
    const reviewRepo = AppDataSource.getRepository(Review);
    
    console.log('Deleting reviews...');
    await reviewRepo.query('DELETE FROM review');
    
    console.log('Deleting product details...');
    await productDetailRepo.query('DELETE FROM product_detail');
    
    console.log('Deleting products...');
    await productRepo.query('DELETE FROM product');
    
    console.log(' Existing data cleared!');
    
    console.log(' Reseeding with diverse book data...');
    await seedLargeDataset(AppDataSource, 500); 
    
    console.log(' Clear and reseed completed successfully!');
    
  } catch (error) {
    console.error(' Error during clear and reseed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  clearAndReseed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { clearAndReseed };