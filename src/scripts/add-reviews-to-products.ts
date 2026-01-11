import { DataSource } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { Category } from '../database/entities/category.entity';
import { Navigation } from '../database/entities/navigation.entity';
import { ProductDetail } from '../database/entities/product-detail.entity';
import { Review } from '../database/entities/review.entity';
import { ScrapeJob } from '../database/entities/scrape-job.entity';
import { ViewHistory } from '../database/entities/view-history.entity';

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function addReviewsToProducts() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'product_explorer',
    entities: [Product, Category, Navigation, ProductDetail, Review, ScrapeJob, ViewHistory],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const productRepository = dataSource.getRepository(Product);
  const reviewRepository = dataSource.getRepository(Review);

  const products = await productRepository.find({ relations: ['detail'] });
  console.log(`Found ${products.length} products to add reviews to`);

  const reviewAuthors = [
    'BookLover', 'ReadingFan', 'LiteratureEnthusiast', 'BookwormReader', 'NovelAddict',
    'PageTurner', 'StorySeeker', 'BookCritic', 'NovelReader', 'BookAddict',
    'ReadingEnthusiast', 'BookwormLife', 'LiteraryFan', 'BookReviewer', 'StoryLover'
  ];

  const reviewTexts = [
    'Absolutely captivating! Could not put it down.',
    'Well-written with complex characters and engaging plot.',
    'A masterpiece of storytelling. Highly recommended.',
    'Great book, though the pacing was a bit slow in places.',
    'Excellent character development and beautiful prose.',
    'This book changed my perspective on life.',
    'Couldn\'t put it down - read it in one sitting!',
    'Beautiful writing style and compelling narrative.',
    'One of the best books I\'ve read this year.',
    'Highly recommend to anyone who enjoys good literature.',
    'The author has a unique voice that draws you in.',
    'Thought-provoking and emotionally engaging.',
    'A page-turner from start to finish.',
    'Rich storytelling with memorable characters.',
    'Beautifully crafted with attention to detail.',
    'An immersive reading experience.',
    'The plot twists kept me guessing.',
    'Excellent world-building and character arcs.',
    'A compelling story that stays with you.',
    'Masterful writing that flows effortlessly.'
  ];

  let totalReviewsCreated = 0;
  const batchSize = 50;
  const batches = Math.ceil(products.length / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, products.length);
    const batchProducts = products.slice(batchStart, batchEnd);

    console.log(`Processing batch ${batch + 1}/${batches} (${batchProducts.length} products)`);

    const reviewsToCreate = [];

    for (const product of batchProducts) {
      const reviewCount = Math.floor(Math.random() * 7) + 2;
      
      for (let i = 0; i < reviewCount; i++) {
        const review = {
          productId: product.id,
          author: `${getRandomElement(reviewAuthors)}${Math.floor(Math.random() * 1000)}`,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars (mostly positive)
          text: getRandomElement(reviewTexts),
          reviewDate: getRandomDate(new Date(2023, 0, 1), new Date()),
          helpfulCount: Math.floor(Math.random() * 50),
        };

        reviewsToCreate.push(review);
      }
    }

    if (reviewsToCreate.length > 0) {
      await reviewRepository.save(reviewsToCreate);
      totalReviewsCreated += reviewsToCreate.length;
      console.log(`Created ${reviewsToCreate.length} reviews for batch ${batch + 1}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n Review creation completed:`);
  console.log(`- Total products: ${products.length}`);
  console.log(`- Total reviews created: ${totalReviewsCreated}`);
  console.log(`- Average reviews per product: ${(totalReviewsCreated / products.length).toFixed(1)}`);

  await dataSource.destroy();
  console.log('Database connection closed');
}

addReviewsToProducts().catch(console.error);