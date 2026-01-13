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

    // Use the new batch update method for better efficiency
    await this.batchUpdateImages(productsWithoutImages);
  }

  /**
   * Scrape image for a single product
   */
  private async scrapeProductImage(product: Product): Promise<void> {
    try {
      this.logger.log(`Scraping image for product: ${product.title}`);
      
      // Convert Product entity to ProductItem interface for scraper
      const productItem = {
        sourceId: product.sourceId || product.id.toString(),
        title: product.title,
        author: product.author,
        price: product.price,
        currency: 'GBP',
        imageUrl: product.imageUrl,
        sourceUrl: product.sourceUrl,
        inStock: true
      };
      
      // Use the enhanced scraper service to get or generate image URL
      const imageUrl = await this.scrapingService.scrapeOrGenerateImageUrl(productItem);
      
      if (imageUrl) {
        await this.updateProductImage(product, imageUrl);
        this.logger.log(`✅ Successfully updated image for: ${product.title}`);
      } else {
        this.logger.warn(`⚠️ Could not get image for: ${product.title}`);
        // Generate a placeholder image URL as fallback
        const placeholderImageUrl = this.generatePlaceholderImageUrl(product);
        await this.updateProductImage(product, placeholderImageUrl);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to scrape image for product ${product.title}:`, error.message);
      // Generate a placeholder image URL as fallback
      try {
        const placeholderImageUrl = this.generatePlaceholderImageUrl(product);
        await this.updateProductImage(product, placeholderImageUrl);
      } catch (fallbackError) {
        this.logger.error(`Failed to set placeholder image for ${product.title}:`, fallbackError.message);
      }
    }
  }

  /**
   * Batch update images for multiple products
   */
  async batchUpdateImages(products: Product[]): Promise<void> {
    const productsWithoutImages = products.filter(
      product => !product.imageUrl || product.imageUrl.trim() === ''
    );

    if (productsWithoutImages.length === 0) {
      this.logger.log('All products already have images');
      return;
    }

    this.logger.log(`Starting batch image update for ${productsWithoutImages.length} products`);

    // Convert Product entities to ProductItem interfaces
    const productItems = productsWithoutImages.map(product => ({
      sourceId: product.sourceId || product.id.toString(),
      title: product.title,
      author: product.author,
      price: product.price,
      currency: 'GBP',
      imageUrl: product.imageUrl,
      sourceUrl: product.sourceUrl,
      inStock: true
    }));

    // Use the enhanced batch update method
    const updatedProductItems = await this.scrapingService.batchUpdateMissingImages(productItems);

    // Update database with new image URLs
    for (let i = 0; i < updatedProductItems.length; i++) {
      const updatedItem = updatedProductItems[i];
      const originalProduct = productsWithoutImages[i];

      if (updatedItem.imageUrl && updatedItem.imageUrl !== originalProduct.imageUrl) {
        await this.updateProductImage(originalProduct, updatedItem.imageUrl);
        this.logger.log(`✅ Updated image for: ${originalProduct.title}`);
      }
    }

    this.logger.log(`Completed batch image update`);
  }

  /**
   * Generate a placeholder image URL for a product
   */
  private generatePlaceholderImageUrl(product: Product): string {
    // Use a book cover placeholder service
    const title = encodeURIComponent(product.title);
    const author = encodeURIComponent(product.author || 'Unknown Author');
    
    // Using a placeholder service that generates book covers
    return `https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=${title}+by+${author}`;
  }

  /**
   * Update product with image URL
   */
  private async updateProductImage(product: Product, imageUrl: string): Promise<void> {
    await this.productRepository.update(product.id, {
      imageUrl: imageUrl,
      lastScrapedAt: new Date(),
    });
    
    // Update the product object in memory so it's returned with the image
    product.imageUrl = imageUrl;
    product.lastScrapedAt = new Date();
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