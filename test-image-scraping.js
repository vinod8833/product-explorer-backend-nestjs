// Test image scraping functionality
const axios = require('axios');

const BASE_URL = 'https://product-explorer-backend-nestjs-production.up.railway.app';

console.log('🧪 Testing Image Scraping...');
console.log('Base URL:', BASE_URL);
console.log('');

async function testImageScraping() {
  try {
    console.log('1. 📊 Checking current products and their image status...');
    
    const response = await axios.get(`${BASE_URL}/api/products?page=1&limit=3&sortBy=id&sortOrder=DESC`);
    
    if (response.data && response.data.data) {
      const products = response.data.data;
      console.log(`Found ${products.length} products:`);
      
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title} by ${product.author}`);
        console.log(`   Price: £${product.price}`);
        console.log(`   Image: ${product.imageUrl || 'No image (should be scraped automatically)'}`);
        console.log(`   Source: ${product.sourceUrl}`);
        console.log(`   Last Scraped: ${product.lastScrapedAt || 'Never'}`);
      });
      
      const productsWithoutImages = products.filter(p => !p.imageUrl);
      const productsWithImages = products.filter(p => p.imageUrl);
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Products with images: ${productsWithImages.length}`);
      console.log(`   ❌ Products without images: ${productsWithoutImages.length}`);
      
      if (productsWithoutImages.length > 0) {
        console.log(`\n🔄 Making multiple API calls to trigger automatic scraping...`);
        
        // Make several API calls to trigger automatic scraping
        for (let i = 0; i < 3; i++) {
          console.log(`\n   API Call ${i + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          
          const testResponse = await axios.get(`${BASE_URL}/api/products?page=1&limit=3&sortBy=id&sortOrder=DESC`);
          
          if (testResponse.data && testResponse.data.data) {
            const updatedProducts = testResponse.data.data;
            const newProductsWithImages = updatedProducts.filter(p => p.imageUrl);
            
            console.log(`   Products with images after call ${i + 1}: ${newProductsWithImages.length}`);
            
            if (newProductsWithImages.length > productsWithImages.length) {
              console.log(`   🎉 New images found!`);
              newProductsWithImages.forEach(product => {
                if (product.imageUrl && !products.find(p => p.id === product.id && p.imageUrl)) {
                  console.log(`      ✅ ${product.title} - ${product.imageUrl}`);
                }
              });
            }
          }
        }
        
        // Final check
        console.log(`\n3. 📸 Final status check...`);
        const finalResponse = await axios.get(`${BASE_URL}/api/products?page=1&limit=3&sortBy=id&sortOrder=DESC`);
        
        if (finalResponse.data && finalResponse.data.data) {
          const finalProducts = finalResponse.data.data;
          const finalProductsWithImages = finalProducts.filter(p => p.imageUrl);
          const finalProductsWithoutImages = finalProducts.filter(p => !p.imageUrl);
          
          console.log(`\n📊 Final Summary:`);
          console.log(`   ✅ Products with images: ${finalProductsWithImages.length}`);
          console.log(`   ❌ Products without images: ${finalProductsWithoutImages.length}`);
          
          if (finalProductsWithImages.length > productsWithImages.length) {
            console.log(`\n🎉 SUCCESS! ${finalProductsWithImages.length - productsWithImages.length} new images were scraped!`);
            finalProductsWithImages.forEach(product => {
              if (product.imageUrl) {
                console.log(`   ✅ ${product.title}: ${product.imageUrl}`);
              }
            });
          } else {
            console.log(`\n⚠️ No new images were scraped. This might be because:`);
            console.log(`   - The source URLs don't exist on World of Books`);
            console.log(`   - The scraping service encountered errors`);
            console.log(`   - The automatic scraping is not triggering properly`);
          }
        }
      } else {
        console.log(`\n🎉 All products already have images!`);
      }
      
    } else {
      console.log('❌ No product data received');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testImageScraping().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('\n💥 Test failed:', error.message);
});