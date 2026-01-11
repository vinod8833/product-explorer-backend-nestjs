"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../database/entities/product.entity");
const category_entity_1 = require("../database/entities/category.entity");
const navigation_entity_1 = require("../database/entities/navigation.entity");
const product_detail_entity_1 = require("../database/entities/product-detail.entity");
const review_entity_1 = require("../database/entities/review.entity");
const scrape_job_entity_1 = require("../database/entities/scrape-job.entity");
const view_history_entity_1 = require("../database/entities/view-history.entity");
const generateWorldOfBooksImageUrl = (sourceId, isbn) => {
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
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'product_explorer',
        entities: [product_entity_1.Product, category_entity_1.Category, navigation_entity_1.Navigation, product_detail_entity_1.ProductDetail, review_entity_1.Review, scrape_job_entity_1.ScrapeJob, view_history_entity_1.ViewHistory],
        synchronize: false,
    });
    await dataSource.initialize();
    console.log('Database connected');
    const productRepository = dataSource.getRepository(product_entity_1.Product);
    const products = await productRepository.find({ relations: ['detail'] });
    console.log(`Found ${products.length} products to update`);
    let updatedCount = 0;
    let skippedCount = 0;
    for (const product of products) {
        if (product.imageUrl && product.imageUrl.includes('worldofbooks.com')) {
            skippedCount++;
            continue;
        }
        const newImageUrl = generateWorldOfBooksImageUrl(product.sourceId, product.detail?.isbn);
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
//# sourceMappingURL=update-images-to-world-of-books.js.map