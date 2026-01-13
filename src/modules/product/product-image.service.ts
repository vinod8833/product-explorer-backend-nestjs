import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { WorldOfBooksScraperService } from '../scraping/world-of-books-scraper.service';

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly scrapingService: WorldOfBooksScraperService,
  ) {}

  /**
   * Handle missing images by automatically scraping them from World of Books
   */
  async handleMissingImages(products: Product[]): Promise<void> {
    const productsWithoutImages = products.filter(
      product => !product.imageUrl || product.imageUrl.trim() === ''
    );

    if (productsWithoutImages.length === 0) {
      return;
    }

    this.logger.log(`Found ${productsWithoutImages.length} products without images, starting automatic scraping...`);

    // Process products in batches to avoid overwhelming the scraping service
    const batchSize = 3;
    for (let i = 0; i < productsWithoutImages.length; i += batchSize) {
      const batch = productsWithoutImages.slice(i, i + batchSize);
      
      // Process batch concurrently but with controlled concurrency
      const promises = batch.map(product => this.scrapeProductImage(product));
      await Promise.allSettled(promises);
      
      // Add delay between batches to be respectful to the target site
      if (i + batchSize < productsWithoutImages.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Scrape image for a single product
   */
  private async scrapeProductImage(product: Product): Promise<void> {
    try {
      this.logger.log(`Scraping image for product: ${product.title}`);
      
      // Use the existing scraping service to get product details
      const scrapedData = await this.scrapingService.scrapeProductDetail(product.sourceUrl);
      
      if (scrapedData && scrapedData.imageUrl) {
        // Update the product with the scraped image URL
        await this.productRepository.update(product.id, {
          imageUrl: scrapedData.imageUrl,
          lastScrapedAt: new Date(),
        });
        
        // Update the product object in memory so it's returned with the image
        product.imageUrl = scrapedData.imageUrl;
        product.lastScrapedAt = new Date();
        
        this.logger.log(`✅ Successfully scraped image for: ${product.title}`);
      } else {
        this.logger.warn(`⚠️ No image found for product: ${product.title}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to scrape image for product ${product.title}:`, error.message);
      // Don't throw error - continue with other products
    }
  }

  /**
   * Verify if an image URL is accessible
   */
  async verifyImageUrl(imageUrl: string): Promise<boolean> {
    return this.scrapingService.verifyImageUrl(imageUrl);
  }

  /**
   * Scrape image for a specific product by ID
   */
  async scrapeImageForProduct(productId: number): Promise<boolean> {
    try {
      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        this.logger.error(`Product with ID ${productId} not found`);
        return false;
      }

      await this.scrapeProductImage(product);
      return true;
    } catch (error) {
      this.logger.error(`Failed to scrape image for product ID ${productId}:`, error.message);
      return false;
    }
  }
}