
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ScrapingService } from '../modules/scraping/scraping.service';
import { WorldOfBooksScraperService } from '../modules/scraping/world-of-books-scraper.service';
import { WorldOfBooksApiService } from '../modules/scraping/world-of-books-api.service';

async function testScraping() {
  console.log('Starting World of Books scraping test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const scrapingService = app.get(ScrapingService);
  const scraperService = app.get(WorldOfBooksScraperService);
  const apiService = app.get(WorldOfBooksApiService);

  try {
    console.log(' Testing World of Books API Service...');    
    console.log('  → Searching for budget books...');
    const budgetBooks = await apiService.getBudgetBooks(2.99, 0, 5);
    console.log(`   Found ${budgetBooks.products.length} budget books`);
    
    if (budgetBooks.products.length > 0) {
      console.log(`   Sample book: "${budgetBooks.products[0].title}" by ${budgetBooks.products[0].author} - £${budgetBooks.products[0].price}`);
    }

    console.log('\n  → Searching for books by query...');
    const searchResults = await apiService.searchProducts({ query: 'javascript' }, 0, 3);
    console.log(`   Found ${searchResults.products.length} JavaScript books`);
    
    if (searchResults.products.length > 0) {
      console.log(`   Sample book: "${searchResults.products[0].title}" - £${searchResults.products[0].price}`);
    }

    console.log('\n  Testing Web Scraping Service...');
    
    console.log('  → Scraping navigation...');
    const navigation = await scraperService.scrapeNavigation();
    console.log(`   Found ${navigation.length} navigation items`);
    
    if (navigation.length > 0) {
      console.log(`   Sample nav: "${navigation[0].title}" -> ${navigation[0].url}`);
      
      console.log('\n  → Scraping categories from first navigation item...');
      try {
        const categories = await scraperService.scrapeCategories(navigation[0].url, 1);
        console.log(`   Found ${categories.length} categories`);
        
        if (categories.length > 0) {
          console.log(`   Sample category: "${categories[0].title}" -> ${categories[0].url}`);
          
          console.log('\n  → Scraping products from first category...');
          try {
            const products = await scraperService.scrapeProducts(categories[0].url, 1);
            console.log(`   Found ${products.length} products`);
            
            if (products.length > 0) {
              console.log(`   Sample product: "${products[0].title}" by ${products[0].author} - £${products[0].price}`);
              
              console.log('\n  → Scraping product detail...');
              try {
                const productDetail = await scraperService.scrapeProductDetail(products[0].sourceUrl);
                console.log(`   Product detail scraped successfully`);
                console.log(`   Description length: ${productDetail.description?.length || 0} characters`);
                console.log(`   Reviews: ${productDetail.reviews?.length || 0}`);
              } catch (error) {
                console.log(`    Product detail scraping failed: ${error.message}`);
              }
            }
          } catch (error) {
            console.log(`    Product scraping failed: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`    Category scraping failed: ${error.message}`);
      }
    }

    console.log('\n⚡ Testing Job Queue System...');
    
    console.log('  → Creating navigation scrape job...');
    const job = await scrapingService.triggerNavigationScrape('https://www.worldofbooks.com');
    console.log(`   Job created with ID: ${job.id}`);
    
    console.log('  → Getting scraping stats...');
    const stats = await scrapingService.getStats();
    console.log(`   Total jobs: ${stats.totalJobs}, Completed: ${stats.completedJobs}, Failed: ${stats.failedJobs}`);
    console.log(`   Total items scraped: ${stats.totalItemsScraped}`);

  } catch (error) {
    console.error(' Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }

  console.log('\n Scraping test completed!');
}

if (require.main === module) {
  testScraping().catch(console.error);
}

export { testScraping };