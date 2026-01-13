// Scrape missing images from World of Books and update database
const { Client } = require('pg');
const { PlaywrightCrawler } = require('crawlee');

const DATABASE_URL = 'postgresql://postgres:PKzoOzvUtjJgxIzKpOoXALIIAfLuHWls@centerbeam.proxy.rlwy.net:13082/railway';

console.log('🖼️ Scraping Missing Images from World of Books...');

async function scrapeAndUpdateImages() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database');
    
    // Get products without images
    const productsWithoutImages = await client.query(`
      SELECT id, title, author, source_url 
      FROM product 
      WHERE image_url IS NULL OR image_url = ''
      ORDER BY id
    `);
    
    console.log(`📸 Found ${productsWithoutImages.rows.length} products without images`);
    
    if (productsWithoutImages.rows.length === 0) {
      console.log('✅ All products already have images!');
      return;
    }
    
    // Create crawler to scrape images
    const crawler = new PlaywrightCrawler({
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      },
      requestHandlerTimeoutSecs: 30,
      maxRequestRetries: 2,
      maxConcurrency: 1,
      
      requestHandler: async ({ page, request }) => {
        const productId = request.userData.productId;
        const productTitle = request.userData.title;
        
        try {
          console.log(`🔍 Scraping image for: ${productTitle}`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (compatible; ProductExplorer/1.0)',
          });

          await page.waitForLoadState('networkidle', { timeout: 30000 });
          
          // Try multiple selectors for product images
          const imageUrl = await page.evaluate(() => {
            const selectors = [
              '.product-image img',
              '.book-image img', 
              '.main-image img',
              'img[class*="product"]',
              'img[class*="book"]',
              '.product-gallery img',
              '.item-image img',
              'img[alt*="cover"]',
              'img[alt*="book"]',
              '.cover-image img',
              'img[src*="cover"]',
              'img[src*="book"]'
            ];
            
            for (const selector of selectors) {
              const img = document.querySelector(selector);
              if (img && img.src && img.src.startsWith('http')) {
                return img.src;
              }
            }
            
            // Fallback: find any reasonable image
            const allImages = Array.from(document.querySelectorAll('img'));
            for (const img of allImages) {
              if (img.src && img.src.startsWith('http') && 
                  (img.src.includes('cover') || img.src.includes('book') || 
                   img.width > 100 || img.height > 100)) {
                return img.src;
              }
            }
            
            return null;
          });
          
          if (imageUrl) {
            // Update database with found image
            await client.query(
              'UPDATE product SET image_url = $1 WHERE id = $2',
              [imageUrl, productId]
            );
            console.log(`✅ Updated image for "${productTitle}": ${imageUrl}`);
          } else {
            console.log(`❌ No image found for "${productTitle}"`);
          }
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Failed to scrape image for "${productTitle}":`, error.message);
        }
      },
      
      failedRequestHandler: async ({ request, error }) => {
        console.error(`❌ Request failed for ${request.url}:`, error.message);
      },
    });
    
    // Queue all products for scraping
    const requests = productsWithoutImages.rows.map(product => ({
      url: product.source_url,
      userData: {
        productId: product.id,
        title: product.title,
        author: product.author
      }
    }));
    
    console.log(`🚀 Starting image scraping for ${requests.length} products...`);
    await crawler.run(requests);
    
    // Check results
    const updatedProducts = await client.query(`
      SELECT id, title, image_url 
      FROM product 
      WHERE image_url IS NOT NULL AND image_url != ''
      ORDER BY id
    `);
    
    console.log(`\n🎉 Image scraping completed!`);
    console.log(`📸 Products with images: ${updatedProducts.rows.length}`);
    updatedProducts.rows.forEach(product => {
      console.log(`  ✅ ${product.title}: ${product.image_url}`);
    });
    
    await crawler.teardown();
    
  } catch (error) {
    console.error('❌ Image scraping failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
  }
}

scrapeAndUpdateImages();