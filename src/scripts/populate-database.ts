import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WorldOfBooksApiService } from '../modules/scraping/world-of-books-api.service';
import { ProductService } from '../modules/product/product.service';
import { CategoryService } from '../modules/category/category.service';

async function populateDatabase() {
  console.log('🚀 Starting database population with live World of Books data...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const apiService = app.get(WorldOfBooksApiService);
    const productService = app.get(ProductService);
    const categoryService = app.get(CategoryService);

    console.log('📦 Fetching budget books...');
    const budgetBooks = await apiService.getBudgetBooks(5.00, 0, 50);
    console.log(`Found ${budgetBooks.products.length} budget books`);

    console.log('🔍 Fetching programming books...');
    const programmingBooks = await apiService.searchProducts({ query: 'programming' }, 0, 20);
    console.log(`Found ${programmingBooks.products.length} programming books`);

    console.log('📚 Fetching fiction books...');
    const fictionBooks = await apiService.searchProducts({ query: 'fiction' }, 0, 30);
    console.log(`Found ${fictionBooks.products.length} fiction books`);

    console.log('✅ Database population completed!');
    
  } catch (error) {
    console.error('❌ Population failed:', error.message);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  populateDatabase().catch(console.error);
}

export { populateDatabase };