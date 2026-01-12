"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAndReseed = clearAndReseed;
const data_source_1 = require("../database/data-source");
const product_entity_1 = require("../database/entities/product.entity");
const product_detail_entity_1 = require("../database/entities/product-detail.entity");
const review_entity_1 = require("../database/entities/review.entity");
const seed_large_dataset_1 = require("./seed-large-dataset");
async function clearAndReseed() {
    console.log(' Clearing existing product data...');
    try {
        await data_source_1.AppDataSource.initialize();
        const productRepo = data_source_1.AppDataSource.getRepository(product_entity_1.Product);
        const productDetailRepo = data_source_1.AppDataSource.getRepository(product_detail_entity_1.ProductDetail);
        const reviewRepo = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
        console.log('Deleting reviews...');
        await reviewRepo.query('DELETE FROM review');
        console.log('Deleting product details...');
        await productDetailRepo.query('DELETE FROM product_detail');
        console.log('Deleting products...');
        await productRepo.query('DELETE FROM product');
        console.log(' Existing data cleared!');
        console.log(' Reseeding with diverse book data...');
        await (0, seed_large_dataset_1.seedLargeDataset)(data_source_1.AppDataSource, 500);
        console.log(' Clear and reseed completed successfully!');
    }
    catch (error) {
        console.error(' Error during clear and reseed:', error);
        throw error;
    }
    finally {
        await data_source_1.AppDataSource.destroy();
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
//# sourceMappingURL=clear-and-reseed.js.map