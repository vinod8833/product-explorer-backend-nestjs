"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDemo = runDemo;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const scraping_service_1 = require("../modules/scraping/scraping.service");
const world_of_books_scraper_service_1 = require("../modules/scraping/world-of-books-scraper.service");
const world_of_books_api_service_1 = require("../modules/scraping/world-of-books-api.service");
const world_of_books_enhanced_service_1 = require("../modules/scraping/world-of-books-enhanced.service");
async function runDemo() {
    console.log('🚀 World of Books Scraping Demo\n');
    console.log('='.repeat(60));
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const scrapingService = app.get(scraping_service_1.ScrapingService);
    const scraperService = app.get(world_of_books_scraper_service_1.WorldOfBooksScraperService);
    const apiService = app.get(world_of_books_api_service_1.WorldOfBooksApiService);
    const enhancedService = app.get(world_of_books_enhanced_service_1.WorldOfBooksEnhancedService);
    try {
        console.log('\n DEMO 1: Site Access Test');
        console.log('-'.repeat(40));
        const accessTest = await enhancedService.testSiteAccess();
        if (accessTest.accessible) {
            console.log(' Site is accessible');
            console.log(` Page title: ${accessTest.title}`);
        }
        else {
            console.log(' Site access failed:', accessTest.error);
        }
        console.log('\n DEMO 2: API Service - Live Data');
        console.log('-'.repeat(40));
        console.log(' Searching for budget books under £2.99...');
        const budgetBooks = await apiService.getBudgetBooks(2.99, 0, 5);
        console.log(` Found ${budgetBooks.products.length} budget books`);
        if (budgetBooks.products.length > 0) {
            console.log('\n Sample Budget Books:');
            budgetBooks.products.slice(0, 3).forEach((book, i) => {
                console.log(`  ${i + 1}. "${book.title}"`);
                console.log(`     Author: ${book.author || 'Unknown'}`);
                console.log(`     Price: £${book.price}`);
                console.log(`     In Stock: ${book.inStock ? 'Yes' : 'No'}`);
                console.log('');
            });
        }
        console.log(' Searching for programming books...');
        const programmingBooks = await apiService.searchProducts({
            query: 'programming'
        }, 0, 3);
        console.log(` Found ${programmingBooks.products.length} programming books`);
        if (programmingBooks.products.length > 0) {
            console.log('\n Sample Programming Books:');
            programmingBooks.products.forEach((book, i) => {
                console.log(`  ${i + 1}. "${book.title}"`);
                console.log(`     Author: ${book.author || 'Unknown'}`);
                console.log(`     Price: £${book.price}`);
                console.log('');
            });
        }
        console.log('  Searching collection products...');
        const collectionBooks = await apiService.getProductsByCollection(world_of_books_api_service_1.WorldOfBooksApiService.COLLECTIONS.SALE_COLLECTION_1, 0, 3);
        console.log(` Found ${collectionBooks.products.length} books in sale collection`);
        console.log('\n  DEMO 3: Web Scraping - Detailed Data');
        console.log('-'.repeat(40));
        console.log(' Scraping collection page...');
        try {
            const collectionUrl = 'https://www.worldofbooks.com/en-gb/category/fiction';
            const scrapedBooks = await enhancedService.scrapeCollectionBooks(collectionUrl, 1);
            console.log(` Scraped ${scrapedBooks.length} books from collection`);
            if (scrapedBooks.length > 0) {
                console.log('\n Sample Scraped Books:');
                scrapedBooks.slice(0, 3).forEach((book, i) => {
                    console.log(`  ${i + 1}. "${book.title}"`);
                    console.log(`     Author: ${book.author || 'Unknown'}`);
                    console.log(`     Price: £${book.price}`);
                    console.log(`     Source ID: ${book.sourceId}`);
                    console.log(`     URL: ${book.sourceUrl}`);
                    console.log('');
                });
                console.log(' Scraping product details...');
                const firstBook = scrapedBooks[0];
                if (firstBook.sourceUrl) {
                    try {
                        const productDetail = await enhancedService.scrapeProductDetails(firstBook.sourceUrl);
                        if (productDetail) {
                            console.log(' Product detail scraped successfully');
                            console.log(` Title: ${productDetail.title}`);
                            console.log(` Author: ${productDetail.author || 'Unknown'}`);
                            console.log(` Price: £${productDetail.price}`);
                            console.log(` Description: ${productDetail.description?.substring(0, 100)}...`);
                            console.log(` Publisher: ${productDetail.publisher || 'Unknown'}`);
                            console.log(` ISBN: ${productDetail.isbn || 'Unknown'}`);
                            console.log(` Pages: ${productDetail.pageCount || 'Unknown'}`);
                        }
                        else {
                            console.log('  No product details extracted');
                        }
                    }
                    catch (error) {
                        console.log(`  Product detail scraping failed: ${error.message}`);
                    }
                }
            }
        }
        catch (error) {
            console.log(`  Collection scraping failed: ${error.message}`);
            console.log('This might be due to site structure changes or anti-bot measures');
        }
        console.log('\n⚡ DEMO 4: Job Queue System');
        console.log('-'.repeat(40));
        console.log(' Creating scraping jobs...');
        const navJob = await scrapingService.triggerNavigationScrape('https://www.worldofbooks.com');
        console.log(` Navigation job created: ID ${navJob.id}`);
        const categoryJob = await scrapingService.triggerCategoryScrape('https://www.worldofbooks.com/en-gb/category/fiction');
        console.log(` Category job created: ID ${categoryJob.id}`);
        const stats = await scrapingService.getStats();
        console.log('\n Scraping Statistics:');
        console.log(`  Total Jobs: ${stats.totalJobs}`);
        console.log(`  Pending: ${stats.pendingJobs}`);
        console.log(`  Running: ${stats.runningJobs}`);
        console.log(`  Completed: ${stats.completedJobs}`);
        console.log(`  Failed: ${stats.failedJobs}`);
        console.log(`  Total Items Scraped: ${stats.totalItemsScraped}`);
        console.log(`  Last Scrape: ${stats.lastScrapeAt || 'Never'}`);
        console.log('\n DEMO 5: Available API Endpoints');
        console.log('-'.repeat(40));
        console.log(' API Service Endpoints:');
        console.log('  GET /products/live/search - Search products (live data)');
        console.log('  GET /products/live/budget - Get budget books');
        console.log('  GET /products/live/collection/:id - Get collection products');
        console.log('  GET /products/live/ids - Get products by IDs');
        console.log('  GET /products/live/cart - Get cart information');
        console.log('\n  Scraping Endpoints:');
        console.log('  POST /scraping/navigation - Trigger navigation scraping');
        console.log('  POST /scraping/categories - Trigger category scraping');
        console.log('  POST /scraping/products - Trigger product list scraping');
        console.log('  POST /scraping/product-detail - Trigger product detail scraping');
        console.log('  GET /scraping/jobs - Get scraping jobs');
        console.log('  GET /scraping/stats - Get scraping statistics');
        console.log('\n DEMO 6: Usage Examples');
        console.log('-'.repeat(40));
        console.log(' Quick Start Examples:');
        console.log('');
        console.log('1. Get budget books via API:');
        console.log('   curl "http://localhost:3000/products/live/budget?maxPrice=5.00&page=1&limit=10"');
        console.log('');
        console.log('2. Search books via API:');
        console.log('   curl "http://localhost:3000/products/live/search?q=javascript&page=1&limit=5"');
        console.log('');
        console.log('3. Trigger scraping job:');
        console.log('   curl -X POST "http://localhost:3000/scraping/navigation" \\');
        console.log('        -H "Content-Type: application/json" \\');
        console.log('        -d \'{"baseUrl": "https://www.worldofbooks.com"}\'');
        console.log('');
        console.log('4. Check scraping stats:');
        console.log('   curl "http://localhost:3000/scraping/stats"');
    }
    catch (error) {
        console.error('\n Demo failed:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    }
    finally {
        await app.close();
    }
    console.log('\n Demo completed!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next Steps:');
    console.log('1. Start the backend server: npm run start:dev');
    console.log('2. Visit http://localhost:3000/api for Swagger documentation');
    console.log('3. Use the API endpoints to fetch live data');
    console.log('4. Create scraping jobs for detailed data extraction');
    console.log('5. Monitor job progress via /scraping/jobs endpoint');
}
if (require.main === module) {
    runDemo().catch(console.error);
}
//# sourceMappingURL=demo-scraping.js.map