"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const navigation_entity_1 = require("./entities/navigation.entity");
const category_entity_1 = require("./entities/category.entity");
const product_entity_1 = require("./entities/product.entity");
const product_detail_entity_1 = require("./entities/product-detail.entity");
const review_entity_1 = require("./entities/review.entity");
async function seedDatabase(dataSource) {
    console.log('Starting database seeding...');
    const navigationRepo = dataSource.getRepository(navigation_entity_1.Navigation);
    const sampleNavigation = [
        {
            title: 'Books',
            slug: 'books',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/books',
        },
        {
            title: 'Fiction',
            slug: 'fiction',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/fiction',
        },
        {
            title: 'Non-Fiction',
            slug: 'non-fiction',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/non-fiction',
        },
        {
            title: 'Children\'s Books',
            slug: 'childrens-books',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/childrens-books',
        },
    ];
    const savedNavigation = [];
    for (const nav of sampleNavigation) {
        const existing = await navigationRepo.findOne({ where: { slug: nav.slug } });
        if (!existing) {
            const navigation = navigationRepo.create(nav);
            savedNavigation.push(await navigationRepo.save(navigation));
        }
        else {
            savedNavigation.push(existing);
        }
    }
    const categoryRepo = dataSource.getRepository(category_entity_1.Category);
    const sampleCategories = [
        {
            navigationId: savedNavigation[0].id,
            title: 'Mystery & Thriller',
            slug: 'mystery-thriller',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/mystery-thriller',
            productCount: 150,
        },
        {
            navigationId: savedNavigation[0].id,
            title: 'Romance',
            slug: 'romance',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/romance',
            productCount: 200,
        },
        {
            navigationId: savedNavigation[0].id,
            title: 'Science Fiction',
            slug: 'science-fiction',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/science-fiction',
            productCount: 120,
        },
        {
            navigationId: savedNavigation[2].id,
            title: 'Biography',
            slug: 'biography',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/category/biography',
            productCount: 80,
        },
    ];
    const savedCategories = [];
    for (const cat of sampleCategories) {
        const existing = await categoryRepo.findOne({ where: { slug: cat.slug } });
        if (!existing) {
            const category = categoryRepo.create(cat);
            savedCategories.push(await categoryRepo.save(category));
        }
        else {
            savedCategories.push(existing);
        }
    }
    const productRepo = dataSource.getRepository(product_entity_1.Product);
    const productDetailRepo = dataSource.getRepository(product_detail_entity_1.ProductDetail);
    const reviewRepo = dataSource.getRepository(review_entity_1.Review);
    const sampleProducts = [
        {
            sourceId: 'sample-1',
            categoryId: savedCategories[0].id,
            title: 'The Silent Patient',
            author: 'Alex Michaelides',
            price: 8.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=1',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/the-silent-patient',
            inStock: true,
            detail: {
                description: 'A gripping psychological thriller about a woman who refuses to speak after allegedly murdering her husband.',
                publisher: 'Orion Publishing',
                publicationDate: new Date('2019-02-05'),
                isbn: '9781409181637',
                pageCount: 336,
                genres: ['Thriller', 'Mystery', 'Psychological Fiction'],
                ratingsAvg: 4.2,
                reviewsCount: 3,
            },
            reviews: [
                {
                    author: 'BookLover123',
                    rating: 5,
                    text: 'Absolutely gripping! Could not put it down.',
                    reviewDate: new Date('2023-06-15'),
                    helpfulCount: 12,
                },
                {
                    author: 'ReadingFan',
                    rating: 4,
                    text: 'Great plot twist, though the pacing was a bit slow in the middle.',
                    reviewDate: new Date('2023-07-02'),
                    helpfulCount: 8,
                },
                {
                    author: 'ThrillerAddict',
                    rating: 4,
                    text: 'Well-written psychological thriller with complex characters.',
                    reviewDate: new Date('2023-07-20'),
                    helpfulCount: 5,
                },
            ],
        },
        {
            sourceId: 'sample-2',
            categoryId: savedCategories[1].id,
            title: 'Pride and Prejudice',
            author: 'Jane Austen',
            price: 6.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=2',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/pride-and-prejudice',
            inStock: true,
            detail: {
                description: 'A timeless romance novel about Elizabeth Bennet and Mr. Darcy.',
                publisher: 'Penguin Classics',
                publicationDate: new Date('1813-01-28'),
                isbn: '9780141439518',
                pageCount: 432,
                genres: ['Romance', 'Classic Literature', 'Historical Fiction'],
                ratingsAvg: 4.5,
                reviewsCount: 2,
            },
            reviews: [
                {
                    author: 'ClassicReader',
                    rating: 5,
                    text: 'A masterpiece of English literature. Austen\'s wit is unmatched.',
                    reviewDate: new Date('2023-05-10'),
                    helpfulCount: 15,
                },
                {
                    author: 'RomanceNovel',
                    rating: 4,
                    text: 'Beautiful love story with well-developed characters.',
                    reviewDate: new Date('2023-06-01'),
                    helpfulCount: 9,
                },
            ],
        },
        {
            sourceId: 'sample-3',
            categoryId: savedCategories[2].id,
            title: 'Dune',
            author: 'Frank Herbert',
            price: 12.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=3',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/dune',
            inStock: true,
            detail: {
                description: 'Epic science fiction novel set on the desert planet Arrakis.',
                publisher: 'Hodder & Stoughton',
                publicationDate: new Date('1965-08-01'),
                isbn: '9780340960196',
                pageCount: 688,
                genres: ['Science Fiction', 'Space Opera', 'Adventure'],
                ratingsAvg: 4.3,
                reviewsCount: 1,
            },
            reviews: [
                {
                    author: 'SciFiFan',
                    rating: 4,
                    text: 'Complex world-building and intricate plot. A sci-fi masterpiece.',
                    reviewDate: new Date('2023-08-15'),
                    helpfulCount: 20,
                },
            ],
        },
        {
            sourceId: 'sample-4',
            categoryId: savedCategories[0].id,
            title: 'Gone Girl',
            author: 'Gillian Flynn',
            price: 9.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=4',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/gone-girl',
            inStock: true,
            detail: {
                description: 'A dark psychological thriller about a marriage gone terribly wrong.',
                publisher: 'Weidenfeld & Nicolson',
                publicationDate: new Date('2012-06-05'),
                isbn: '9780297859406',
                pageCount: 432,
                genres: ['Thriller', 'Mystery', 'Crime Fiction'],
                ratingsAvg: 4.1,
                reviewsCount: 2,
            },
            reviews: [
                {
                    author: 'MysteryLover',
                    rating: 4,
                    text: 'Twisted and compelling. Flynn knows how to keep you guessing.',
                    reviewDate: new Date('2023-07-10'),
                    helpfulCount: 18,
                },
                {
                    author: 'BookClubMember',
                    rating: 4,
                    text: 'Great discussion starter. Complex characters and moral ambiguity.',
                    reviewDate: new Date('2023-08-05'),
                    helpfulCount: 7,
                },
            ],
        },
        {
            sourceId: 'sample-5',
            categoryId: savedCategories[1].id,
            title: 'The Seven Husbands of Evelyn Hugo',
            author: 'Taylor Jenkins Reid',
            price: 7.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=5',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/seven-husbands-evelyn-hugo',
            inStock: true,
            detail: {
                description: 'A captivating novel about a reclusive Hollywood icon who finally decides to tell her story.',
                publisher: 'Simon & Schuster',
                publicationDate: new Date('2017-06-13'),
                isbn: '9781501161933',
                pageCount: 400,
                genres: ['Romance', 'Historical Fiction', 'LGBTQ+'],
                ratingsAvg: 4.6,
                reviewsCount: 3,
            },
            reviews: [
                {
                    author: 'BookstagramFan',
                    rating: 5,
                    text: 'Absolutely stunning! Could not put it down. Evelyn is unforgettable.',
                    reviewDate: new Date('2023-06-20'),
                    helpfulCount: 25,
                },
                {
                    author: 'HistoricalFictionReader',
                    rating: 5,
                    text: 'Beautiful storytelling and complex characters. A must-read.',
                    reviewDate: new Date('2023-07-15'),
                    helpfulCount: 14,
                },
                {
                    author: 'CasualReader',
                    rating: 4,
                    text: 'Engaging plot with great character development.',
                    reviewDate: new Date('2023-08-01'),
                    helpfulCount: 6,
                },
            ],
        },
        {
            sourceId: 'sample-6',
            categoryId: savedCategories[2].id,
            title: 'The Martian',
            author: 'Andy Weir',
            price: 8.49,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=6',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/the-martian',
            inStock: true,
            detail: {
                description: 'A gripping tale of survival on Mars with humor and hard science.',
                publisher: 'Del Rey',
                publicationDate: new Date('2014-02-11'),
                isbn: '9780553418026',
                pageCount: 384,
                genres: ['Science Fiction', 'Adventure', 'Hard Science Fiction'],
                ratingsAvg: 4.4,
                reviewsCount: 2,
            },
            reviews: [
                {
                    author: 'ScienceNerd',
                    rating: 5,
                    text: 'Perfect blend of science and humor. Weir makes space survival believable.',
                    reviewDate: new Date('2023-05-25'),
                    helpfulCount: 22,
                },
                {
                    author: 'AdventureSeeker',
                    rating: 4,
                    text: 'Thrilling and educational. Great character development.',
                    reviewDate: new Date('2023-06-30'),
                    helpfulCount: 11,
                },
            ],
        },
        {
            sourceId: 'sample-7',
            categoryId: savedCategories[3].id,
            title: 'Steve Jobs',
            author: 'Walter Isaacson',
            price: 11.99,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=7',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/steve-jobs',
            inStock: true,
            detail: {
                description: 'The definitive biography of Apple co-founder Steve Jobs.',
                publisher: 'Simon & Schuster',
                publicationDate: new Date('2011-10-24'),
                isbn: '9781451648539',
                pageCount: 656,
                genres: ['Biography', 'Technology', 'Business'],
                ratingsAvg: 4.2,
                reviewsCount: 1,
            },
            reviews: [
                {
                    author: 'TechEnthusiast',
                    rating: 4,
                    text: 'Comprehensive look at a complex figure. Well-researched and engaging.',
                    reviewDate: new Date('2023-07-05'),
                    helpfulCount: 16,
                },
            ],
        },
        {
            sourceId: 'sample-8',
            categoryId: savedCategories[0].id,
            title: 'The Girl with the Dragon Tattoo',
            author: 'Stieg Larsson',
            price: 7.49,
            currency: 'GBP',
            imageUrl: 'https://picsum.photos/300/400?random=8',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/book/girl-dragon-tattoo',
            inStock: false,
            detail: {
                description: 'A gripping Swedish crime thriller featuring journalist Mikael Blomkvist and hacker Lisbeth Salander.',
                publisher: 'Quercus',
                publicationDate: new Date('2005-08-01'),
                isbn: '9781847245458',
                pageCount: 544,
                genres: ['Crime', 'Thriller', 'Nordic Noir'],
                ratingsAvg: 4.0,
                reviewsCount: 2,
            },
            reviews: [
                {
                    author: 'CrimeReader',
                    rating: 4,
                    text: 'Dark and compelling. Larsson creates a unique atmosphere.',
                    reviewDate: new Date('2023-06-12'),
                    helpfulCount: 13,
                },
                {
                    author: 'SwedishCrimeFan',
                    rating: 4,
                    text: 'Excellent start to the Millennium series. Complex plot and characters.',
                    reviewDate: new Date('2023-07-28'),
                    helpfulCount: 9,
                },
            ],
        },
    ];
    for (const productData of sampleProducts) {
        const existing = await productRepo.findOne({ where: { sourceId: productData.sourceId } });
        if (existing) {
            const { detail, reviews, ...productInfo } = productData;
            Object.assign(existing, productInfo);
            const savedProduct = await productRepo.save(existing);
            const existingDetail = await productDetailRepo.findOne({ where: { productId: savedProduct.id } });
            if (existingDetail) {
                Object.assign(existingDetail, detail);
                await productDetailRepo.save(existingDetail);
            }
        }
        else {
            const { detail, reviews, ...productInfo } = productData;
            const product = productRepo.create(productInfo);
            const savedProduct = await productRepo.save(product);
            const productDetail = productDetailRepo.create({
                ...detail,
                productId: savedProduct.id,
            });
            await productDetailRepo.save(productDetail);
            for (const reviewData of reviews) {
                const review = reviewRepo.create({
                    ...reviewData,
                    productId: savedProduct.id,
                });
                await reviewRepo.save(review);
            }
        }
    }
    console.log('Database seeding completed successfully!');
}
if (require.main === module) {
    Promise.resolve().then(() => require('./data-source')).then(async ({ AppDataSource }) => {
        try {
            await AppDataSource.initialize();
            await seedDatabase(AppDataSource);
            await AppDataSource.destroy();
            process.exit(0);
        }
        catch (error) {
            console.error('Error during seeding:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=seed.js.map