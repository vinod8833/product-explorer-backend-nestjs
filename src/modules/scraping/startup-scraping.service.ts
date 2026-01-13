import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldOfBooksScraperService } from './world-of-books-scraper.service';
import { ScrapingService } from './scraping.service';
import { Product } from '../../database/entities/product.entity';
import { Category } from '../../database/entities/category.entity';
import { Navigation } from '../../database/entities/navigation.entity';

@Injectable()
export class StartupScrapingService implements OnModuleInit {
  private readonly logger = new Logger(StartupScrapingService.name);
  private readonly isProduction: boolean;
  private readonly enableStartupScraping: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly scraperService: WorldOfBooksScraperService,
    private readonly scrapingService: ScrapingService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Navigation)
    private readonly navigationRepository: Repository<Navigation>,
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.enableStartupScraping = this.configService.get('ENABLE_STARTUP_SCRAPING', 'true') === 'true';
  }

  async onModuleInit() {
    if (!this.enableStartupScraping) {
      this.logger.log('Startup scraping is disabled');
      return;
    }

    this.logger.log('🚀 Starting startup scraping process...');
    
    try {
      // Check if we already have data
      const existingProductCount = await this.productRepository.count();
      const existingCategoryCount = await this.categoryRepository.count();
      const existingNavigationCount = await this.navigationRepository.count();

      this.logger.log(`Current data: ${existingProductCount} products, ${existingCategoryCount} categories, ${existingNavigationCount} navigation items`);

      // If we have no data or very little data, perform initial scraping
      if (existingProductCount === 0 || existingCategoryCount === 0) {
        await this.performInitialScraping();
      } else {
        this.logger.log('Database already has data, skipping initial scraping');
        // Still update missing images for existing products
        await this.updateMissingImages();
      }

    } catch (error) {
      this.logger.error('Startup scraping failed:', error.message);
      // Don't throw error to prevent app startup failure
    }
  }

  private async performInitialScraping(): Promise<void> {
    this.logger.log('📚 Performing initial scraping...');

    try {
      // Step 1: Scrape navigation if needed
      const navigationCount = await this.navigationRepository.count();
      if (navigationCount === 0) {
        this.logger.log('1. Scraping navigation...');
        await this.scrapeNavigation();
      }

      // Step 2: Scrape categories if needed
      const categoryCount = await this.categoryRepository.count();
      if (categoryCount === 0) {
        this.logger.log('2. Scraping categories...');
        await this.scrapeCategories();
      }

      // Step 3: Scrape products if needed
      const productCount = await this.productRepository.count();
      if (productCount === 0) {
        this.logger.log('3. Scraping products...');
        await this.scrapeProducts();
      }

      // Step 4: Update missing images
      await this.updateMissingImages();

      this.logger.log('✅ Initial scraping completed successfully');

    } catch (error) {
      this.logger.error('Initial scraping failed:', error.message);
      // Fallback: Create sample data if scraping fails
      await this.createFallbackData();
    }
  }

  private async scrapeNavigation(): Promise<void> {
    try {
      const navigationItems = await this.scraperService.scrapeNavigation();
      if (navigationItems.length > 0) {
        await this.scrapingService.saveNavigationItems(navigationItems);
        this.logger.log(`✅ Saved ${navigationItems.length} navigation items`);
      } else {
        this.logger.warn('No navigation items found, creating fallback navigation');
        await this.createFallbackNavigation();
      }
    } catch (error) {
      this.logger.error('Navigation scraping failed:', error.message);
      await this.createFallbackNavigation();
    }
  }

  private async scrapeCategories(): Promise<void> {
    try {
      // Get navigation items to scrape categories from
      const navigationItems = await this.navigationRepository.find();
      
      if (navigationItems.length === 0) {
        this.logger.warn('No navigation items found for category scraping');
        await this.createFallbackCategories();
        return;
      }

      let totalCategories = 0;
      for (const navItem of navigationItems.slice(0, 3)) { // Limit to first 3 to avoid overwhelming
        try {
          const categoryItems = await this.scraperService.scrapeCategories(navItem.sourceUrl, 2);
          if (categoryItems.length > 0) {
            await this.scrapingService.saveCategoryItems(categoryItems, navItem.id);
            totalCategories += categoryItems.length;
            this.logger.log(`✅ Saved ${categoryItems.length} categories from ${navItem.title}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape categories from ${navItem.title}:`, error.message);
        }
      }

      if (totalCategories === 0) {
        await this.createFallbackCategories();
      }

    } catch (error) {
      this.logger.error('Category scraping failed:', error.message);
      await this.createFallbackCategories();
    }
  }

  private async scrapeProducts(): Promise<void> {
    try {
      // Get categories to scrape products from
      const categories = await this.categoryRepository.find();
      
      if (categories.length === 0) {
        this.logger.warn('No categories found for product scraping');
        await this.createFallbackProducts();
        return;
      }

      let totalProducts = 0;
      for (const category of categories.slice(0, 3)) { // Limit to first 3 categories
        try {
          const productItems = await this.scraperService.scrapeProducts(category.sourceUrl, 2); // Max 2 pages
          if (productItems.length > 0) {
            await this.scrapingService.saveProductItems(productItems, category.id);
            totalProducts += productItems.length;
            this.logger.log(`✅ Saved ${productItems.length} products from ${category.title}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape products from ${category.title}:`, error.message);
        }
      }

      if (totalProducts === 0) {
        await this.createFallbackProducts();
      }

    } catch (error) {
      this.logger.error('Product scraping failed:', error.message);
      await this.createFallbackProducts();
    }
  }

  private async updateMissingImages(): Promise<void> {
    try {
      this.logger.log('4. Updating missing images...');
      
      const productsWithoutImages = await this.productRepository.find({
        where: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      });

      if (productsWithoutImages.length > 0) {
        this.logger.log(`Found ${productsWithoutImages.length} products without images`);
        
        // Convert to ProductItem format for scraper
        const productItems = productsWithoutImages.map(product => ({
          sourceId: product.sourceId || product.id.toString(),
          title: product.title,
          author: product.author,
          price: parseFloat(product.price.toString()),
          currency: product.currency,
          imageUrl: product.imageUrl,
          sourceUrl: product.sourceUrl,
          inStock: product.inStock
        }));

        const updatedItems = await this.scraperService.batchUpdateMissingImages(productItems);
        
        // Update database with new image URLs
        for (let i = 0; i < updatedItems.length; i++) {
          const updatedItem = updatedItems[i];
          const originalProduct = productsWithoutImages[i];

          if (updatedItem.imageUrl && updatedItem.imageUrl !== originalProduct.imageUrl) {
            await this.productRepository.update(originalProduct.id, {
              imageUrl: updatedItem.imageUrl,
              lastScrapedAt: new Date()
            });
          }
        }

        this.logger.log(`✅ Updated images for products`);
      } else {
        this.logger.log('All products already have images');
      }

    } catch (error) {
      this.logger.error('Image update failed:', error.message);
    }
  }

  private async createFallbackData(): Promise<void> {
    this.logger.log('Creating fallback data...');
    
    try {
      await this.createFallbackNavigation();
      await this.createFallbackCategories();
      await this.createFallbackProducts();
      this.logger.log('✅ Fallback data created successfully');
    } catch (error) {
      this.logger.error('Failed to create fallback data:', error.message);
    }
  }

  private async createFallbackNavigation(): Promise<void> {
    const fallbackNavigation = [
      { title: 'Fiction', slug: 'fiction', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/fiction' },
      { title: 'Non-Fiction', slug: 'non-fiction', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/non-fiction' },
      { title: 'Children Books', slug: 'children-books', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/children' }
    ];

    for (const nav of fallbackNavigation) {
      await this.scrapingService.saveNavigationItems([nav]);
    }
  }

  private async createFallbackCategories(): Promise<void> {
    const navigationItems = await this.navigationRepository.find();
    
    const fallbackCategories = [
      { title: 'Fiction', slug: 'fiction', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/fiction', productCount: 0 },
      { title: 'Non-Fiction', slug: 'non-fiction', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/non-fiction', productCount: 0 },
      { title: 'Children Books', slug: 'children-books', sourceUrl: 'https://www.worldofbooks.com/en-gb/category/children', productCount: 0 }
    ];

    for (let i = 0; i < fallbackCategories.length && i < navigationItems.length; i++) {
      await this.scrapingService.saveCategoryItems([fallbackCategories[i]], navigationItems[i].id);
    }
  }

  private async createFallbackProducts(): Promise<void> {
    const categories = await this.categoryRepository.find();
    
    if (categories.length === 0) return;

    const fallbackProducts = [
      {
        sourceId: 'sample-book-1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 9.99,
        currency: 'GBP',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/81af+MCATTL.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-gb/books/f-scott-fitzgerald/the-great-gatsby/9780743273565',
        inStock: true
      },
      {
        sourceId: 'sample-book-2',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        price: 8.99,
        currency: 'GBP',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-gb/books/harper-lee/to-kill-a-mockingbird/9780061120084',
        inStock: true
      },
      {
        sourceId: 'sample-book-3',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        price: 12.99,
        currency: 'GBP',
        imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg',
        sourceUrl: 'https://www.worldofbooks.com/en-gb/books/yuval-noah-harari/sapiens/9780062316097',
        inStock: true
      }
    ];

    // Distribute products across categories
    for (let i = 0; i < fallbackProducts.length; i++) {
      const categoryIndex = i % categories.length;
      await this.scrapingService.saveProductItems([fallbackProducts[i]], categories[categoryIndex].id);
    }
  }
}