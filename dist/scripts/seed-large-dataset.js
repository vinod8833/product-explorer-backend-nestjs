"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLargeDataset = seedLargeDataset;
const data_source_1 = require("../database/data-source");
const navigation_entity_1 = require("../database/entities/navigation.entity");
const category_entity_1 = require("../database/entities/category.entity");
const product_entity_1 = require("../database/entities/product.entity");
const product_detail_entity_1 = require("../database/entities/product-detail.entity");
const review_entity_1 = require("../database/entities/review.entity");
const getWorldOfBooksImageUrl = (sourceId, isbn) => {
    const cleanSourceId = sourceId.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanSourceId) {
        return getFallbackImageUrl(Math.floor(Math.random() * 1000));
    }
    const patterns = [
        `https://images.worldofbooks.com/book/${cleanSourceId}.jpg`,
        `https://cdn.worldofbooks.com/images/${cleanSourceId}_medium.jpg`,
        `https://static.worldofbooks.com/covers/${cleanSourceId}.jpg`,
        `https://media.worldofbooks.com/book-covers/${cleanSourceId}.jpg`,
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
};
const getFallbackImageUrl = (index) => {
    return `https://images.worldofbooks.com/placeholder/book-${index % 100}.jpg`;
};
const sampleBooks = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', genre: 'Classic Literature' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', genre: 'Classic Literature' },
    { title: '1984', author: 'George Orwell', isbn: '9780451524935', genre: 'Dystopian Fiction' },
    { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', genre: 'Romance' },
    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '9780316769174', genre: 'Coming of Age' },
    { title: 'Lord of the Flies', author: 'William Golding', isbn: '9780571056866', genre: 'Adventure' },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', genre: 'Fantasy' },
    { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '9781451673319', genre: 'Science Fiction' },
    { title: 'Jane Eyre', author: 'Charlotte Brontë', isbn: '9780141441146', genre: 'Gothic Romance' },
    { title: 'Wuthering Heights', author: 'Emily Brontë', isbn: '9780141439556', genre: 'Gothic Romance' },
    { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', isbn: '9780544003415', genre: 'Fantasy' },
    { title: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524', genre: 'Dystopian Fiction' },
    { title: 'The Chronicles of Narnia', author: 'C.S. Lewis', isbn: '9780066238501', genre: 'Fantasy' },
    { title: 'Animal Farm', author: 'George Orwell', isbn: '9780451526342', genre: 'Political Satire' },
    { title: 'Of Mice and Men', author: 'John Steinbeck', isbn: '9780140177398', genre: 'Drama' },
    { title: 'The Grapes of Wrath', author: 'John Steinbeck', isbn: '9780143039433', genre: 'Historical Fiction' },
    { title: 'One Flew Over the Cuckoo\'s Nest', author: 'Ken Kesey', isbn: '9780452284654', genre: 'Drama' },
    { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', isbn: '9780385490818', genre: 'Dystopian Fiction' },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', isbn: '9781594631931', genre: 'Historical Fiction' },
    { title: 'Life of Pi', author: 'Yann Martel', isbn: '9780156027328', genre: 'Adventure' },
    { title: 'The Book Thief', author: 'Markus Zusak', isbn: '9780375842207', genre: 'Historical Fiction' },
    { title: 'The Curious Incident of the Dog in the Night-Time', author: 'Mark Haddon', isbn: '9781400032716', genre: 'Mystery' },
    { title: 'The Time Traveler\'s Wife', author: 'Audrey Niffenegger', isbn: '9780156029438', genre: 'Romance' },
    { title: 'The Lovely Bones', author: 'Alice Sebold', isbn: '9780316166684', genre: 'Drama' },
    { title: 'The Secret Life of Bees', author: 'Sue Monk Kidd', isbn: '9780142001745', genre: 'Historical Fiction' },
    { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', isbn: '9780747532699', genre: 'Fantasy' },
    { title: 'The Da Vinci Code', author: 'Dan Brown', isbn: '9780307474278', genre: 'Thriller' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780061122415', genre: 'Philosophy' },
    { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588364', genre: 'Thriller' },
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '9780307454546', genre: 'Crime' },
    { title: 'The Hunger Games', author: 'Suzanne Collins', isbn: '9780439023528', genre: 'Dystopian Fiction' },
    { title: 'Twilight', author: 'Stephenie Meyer', isbn: '9780316015844', genre: 'Romance' },
    { title: 'The Fault in Our Stars', author: 'John Green', isbn: '9780525478812', genre: 'Young Adult' },
    { title: 'Fifty Shades of Grey', author: 'E.L. James', isbn: '9780345803481', genre: 'Romance' },
    { title: 'The Help', author: 'Kathryn Stockett', isbn: '9780425232200', genre: 'Historical Fiction' },
    { title: 'Water for Elephants', author: 'Sara Gruen', isbn: '9781565125605', genre: 'Historical Fiction' },
    { title: 'The Notebook', author: 'Nicholas Sparks', isbn: '9780446605236', genre: 'Romance' },
    { title: 'Memoirs of a Geisha', author: 'Arthur Golden', isbn: '9780679781585', genre: 'Historical Fiction' },
    { title: 'The Poisonwood Bible', author: 'Barbara Kingsolver', isbn: '9780060175405', genre: 'Literary Fiction' },
    { title: 'Eat, Pray, Love', author: 'Elizabeth Gilbert', isbn: '9780143038412', genre: 'Memoir' },
    { title: 'The Glass Castle', author: 'Jeannette Walls', isbn: '9780743247542', genre: 'Memoir' },
    { title: 'Wild', author: 'Cheryl Strayed', isbn: '9780307476074', genre: 'Memoir' },
    { title: 'Big Little Lies', author: 'Liane Moriarty', isbn: '9780399167065', genre: 'Contemporary Fiction' },
    { title: 'The Goldfinch', author: 'Donna Tartt', isbn: '9780316055437', genre: 'Literary Fiction' },
    { title: 'All the Light We Cannot See', author: 'Anthony Doerr', isbn: '9781476746586', genre: 'Historical Fiction' },
    { title: 'The Martian', author: 'Andy Weir', isbn: '9780553418026', genre: 'Science Fiction' },
    { title: 'Ready Player One', author: 'Ernest Cline', isbn: '9780307887436', genre: 'Science Fiction' },
    { title: 'The Night Circus', author: 'Erin Morgenstern', isbn: '9780307744432', genre: 'Fantasy' },
    { title: 'Station Eleven', author: 'Emily St. John Mandel', isbn: '9780804172448', genre: 'Post-Apocalyptic' },
    { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', isbn: '9781501161933', genre: 'Historical Fiction' },
    { title: 'Where the Crawdads Sing', author: 'Delia Owens', isbn: '9780735219090', genre: 'Mystery' },
    { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', genre: 'Memoir' },
    { title: 'Becoming', author: 'Michelle Obama', isbn: '9781524763138', genre: 'Memoir' },
    { title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', genre: 'Psychological Thriller' },
    { title: 'Circe', author: 'Madeline Miller', isbn: '9780316556347', genre: 'Mythology' },
    { title: 'The Song of Achilles', author: 'Madeline Miller', isbn: '9780062060624', genre: 'Mythology' },
    { title: 'Normal People', author: 'Sally Rooney', isbn: '9781984822178', genre: 'Contemporary Fiction' },
    { title: 'Little Fires Everywhere', author: 'Celeste Ng', isbn: '9780735224292', genre: 'Contemporary Fiction' },
    { title: 'The Testaments', author: 'Margaret Atwood', isbn: '9780385543781', genre: 'Dystopian Fiction' },
    { title: 'Such a Fun Age', author: 'Kiley Reid', isbn: '9780525541905', genre: 'Contemporary Fiction' },
    { title: 'The Vanishing Half', author: 'Brit Bennett', isbn: '9780525536291', genre: 'Historical Fiction' },
    { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', isbn: '9780593318171', genre: 'Science Fiction' },
    { title: 'The Midnight Library', author: 'Matt Haig', isbn: '9780525559474', genre: 'Fantasy' },
    { title: 'Project Hail Mary', author: 'Andy Weir', isbn: '9780593135204', genre: 'Science Fiction' },
    { title: 'The Four Winds', author: 'Kristin Hannah', isbn: '9781250178602', genre: 'Historical Fiction' },
    { title: 'The Invisible Bridge', author: 'Julie Orringer', isbn: '9780375414596', genre: 'Historical Fiction' },
    { title: 'The Nightingale', author: 'Kristin Hannah', isbn: '9780312577223', genre: 'Historical Fiction' },
    { title: 'Eleanor Oliphant Is Completely Fine', author: 'Gail Honeyman', isbn: '9780735220683', genre: 'Contemporary Fiction' },
    { title: 'A Man Called Ove', author: 'Fredrik Backman', isbn: '9781476738024', genre: 'Contemporary Fiction' },
    { title: 'The Rosie Project', author: 'Graeme Simsion', isbn: '9781476729084', genre: 'Romance' },
    { title: 'Me Before You', author: 'Jojo Moyes', isbn: '9780143124542', genre: 'Romance' },
    { title: 'The Light We Lost', author: 'Jill Santopolo', isbn: '9780735212756', genre: 'Romance' },
    { title: 'It Ends with Us', author: 'Colleen Hoover', isbn: '9781501110368', genre: 'Romance' },
    { title: 'The Hating Game', author: 'Sally Thorne', isbn: '9780062439598', genre: 'Romance' },
    { title: 'Beach Read', author: 'Emily Henry', isbn: '9781984806734', genre: 'Romance' },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', isbn: '9781984806758', genre: 'Romance' },
    { title: 'The Spanish Love Deception', author: 'Elena Armas', isbn: '9781668001226', genre: 'Romance' },
    { title: 'The Seven Moons of Maali Almeida', author: 'Shehan Karunatilaka', isbn: '9781641293310', genre: 'Fantasy' },
    { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', isbn: '9780385547345', genre: 'Historical Fiction' },
    { title: 'The Atlas Six', author: 'Olivie Blake', isbn: '9781250854445', genre: 'Fantasy' },
    { title: 'Book Lovers', author: 'Emily Henry', isbn: '9781984806772', genre: 'Romance' },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', isbn: '9781984880987', genre: 'Mystery' },
    { title: 'The Sanatorium', author: 'Sarah Pearse', isbn: '9780593296677', genre: 'Thriller' },
    { title: 'The Guest List', author: 'Lucy Foley', isbn: '9780062868930', genre: 'Thriller' },
    { title: 'The Hunting Party', author: 'Lucy Foley', isbn: '9780062868909', genre: 'Thriller' },
    { title: 'In the Woods', author: 'Tana French', isbn: '9780143113492', genre: 'Mystery' },
    { title: 'The Likeness', author: 'Tana French', isbn: '9780143115588', genre: 'Mystery' },
    { title: 'Faithful Place', author: 'Tana French', isbn: '9780143119944', genre: 'Mystery' },
    { title: 'Broken Harbor', author: 'Tana French', isbn: '9780143122685', genre: 'Mystery' },
    { title: 'The Secret History', author: 'Donna Tartt', isbn: '9781400031702', genre: 'Literary Fiction' },
    { title: 'The Little Friend', author: 'Donna Tartt', isbn: '9781400030699', genre: 'Literary Fiction' },
    { title: 'Never Let Me Go', author: 'Kazuo Ishiguro', isbn: '9781400078776', genre: 'Science Fiction' },
    { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', isbn: '9780679731726', genre: 'Literary Fiction' },
    { title: 'When We Were Orphans', author: 'Kazuo Ishiguro', isbn: '9780375724404', genre: 'Literary Fiction' },
    { title: 'The Buried Giant', author: 'Kazuo Ishiguro', isbn: '9780307455796', genre: 'Fantasy' },
    { title: 'Cloud Atlas', author: 'David Mitchell', isbn: '9780375507250', genre: 'Literary Fiction' },
    { title: 'The Bone Clocks', author: 'David Mitchell', isbn: '9780812976823', genre: 'Fantasy' },
    { title: 'Black Swan Green', author: 'David Mitchell', isbn: '9780812973747', genre: 'Coming of Age' },
    { title: 'Ghostwritten', author: 'David Mitchell', isbn: '9780375724503', genre: 'Literary Fiction' },
    { title: 'number9dream', author: 'David Mitchell', isbn: '9780375507250', genre: 'Literary Fiction' },
    { title: 'The Thousand Autumns of Jacob de Zoet', author: 'David Mitchell', isbn: '9780812976366', genre: 'Historical Fiction' },
    { title: 'Slade House', author: 'David Mitchell', isbn: '9780812988185', genre: 'Fantasy' },
    { title: 'Utopia Avenue', author: 'David Mitchell', isbn: '9780812992793', genre: 'Historical Fiction' },
];
const publishers = [
    'Penguin Classics', 'Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan',
    'Oxford University Press', 'Cambridge University Press', 'Vintage Books', 'Anchor Books',
    'Bantam Books', 'Dell Publishing', 'Doubleday', 'Knopf', 'Little, Brown and Company'
];
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getRandomPrice() {
    return Math.round((Math.random() * 25 + 2.99) * 100) / 100;
}
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
async function seedLargeDataset(dataSource, count = 1200) {
    console.log(`Starting large dataset seeding with ${count} products...`);
    const navigationRepo = dataSource.getRepository(navigation_entity_1.Navigation);
    const categoryRepo = dataSource.getRepository(category_entity_1.Category);
    const productRepo = dataSource.getRepository(product_entity_1.Product);
    const productDetailRepo = dataSource.getRepository(product_detail_entity_1.ProductDetail);
    const reviewRepo = dataSource.getRepository(review_entity_1.Review);
    let navigation = await navigationRepo.findOne({ where: { slug: 'books' } });
    if (!navigation) {
        navigation = navigationRepo.create({
            title: 'Books',
            slug: 'books',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/books',
        });
        navigation = await navigationRepo.save(navigation);
    }
    const categoryData = [
        { title: 'Fiction', slug: 'fiction' },
        { title: 'Non-Fiction', slug: 'non-fiction' },
        { title: 'Mystery & Thriller', slug: 'mystery-thriller' },
        { title: 'Romance', slug: 'romance' },
        { title: 'Science Fiction', slug: 'science-fiction' },
        { title: 'Fantasy', slug: 'fantasy' },
        { title: 'Biography', slug: 'biography' },
        { title: 'History', slug: 'history' },
        { title: 'Self-Help', slug: 'self-help' },
        { title: 'Children\'s Books', slug: 'childrens-books' },
    ];
    const categories = [];
    for (const catData of categoryData) {
        let category = await categoryRepo.findOne({ where: { slug: catData.slug } });
        if (!category) {
            category = categoryRepo.create({
                ...catData,
                navigationId: navigation.id,
                sourceUrl: `https://www.worldofbooks.com/en-gb/category/${catData.slug}`,
                productCount: Math.floor(count / categoryData.length),
            });
            category = await categoryRepo.save(category);
        }
        categories.push(category);
    }
    console.log(`Created ${categories.length} categories`);
    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);
    for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, count);
        const batchCount = batchEnd - batchStart;
        console.log(`Processing batch ${batch + 1}/${batches} (${batchCount} products)`);
        const products = [];
        const productDetails = [];
        const reviews = [];
        for (let i = batchStart; i < batchEnd; i++) {
            const bookIndex = Math.floor(Math.random() * sampleBooks.length);
            const baseBook = sampleBooks[bookIndex];
            const category = getRandomElement(categories);
            const publisher = getRandomElement(publishers);
            const shouldCreateEdition = Math.random() < 0.1;
            const title = shouldCreateEdition ?
                `${baseBook.title} (Edition ${Math.floor(Math.random() * 5) + 1})` :
                baseBook.title;
            const isbn = shouldCreateEdition ?
                `978${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}` :
                baseBook.isbn;
            const sourceId = `book-${i + 1}`;
            let imageUrl;
            try {
                imageUrl = Math.random() > 0.2 ? getWorldOfBooksImageUrl(sourceId, isbn) : getFallbackImageUrl(i + 1);
                new URL(imageUrl);
            }
            catch (error) {
                imageUrl = getFallbackImageUrl(i + 1);
            }
            const price = getRandomPrice();
            const inStock = Math.random() > 0.1;
            const existingProduct = await productRepo.findOne({ where: { sourceId } });
            if (existingProduct) {
                continue;
            }
            const product = {
                sourceId,
                categoryId: category.id,
                title,
                author: baseBook.author,
                price,
                currency: 'GBP',
                imageUrl,
                sourceUrl: `https://www.worldofbooks.com/en-gb/book/${sourceId}`,
                inStock,
                lastScrapedAt: getRandomDate(new Date(2024, 0, 1), new Date()),
            };
            products.push(product);
            const detail = {
                description: `${baseBook.genre} novel by ${baseBook.author}. ${title} is a compelling read that has captivated readers worldwide.`,
                publisher,
                publicationDate: getRandomDate(new Date(1950, 0, 1), new Date(2024, 0, 1)),
                isbn,
                pageCount: Math.floor(Math.random() * 500) + 100,
                genres: [baseBook.genre, category.title],
                ratingsAvg: Math.round((Math.random() * 2 + 3) * 10) / 10,
                reviewsCount: Math.floor(Math.random() * 100),
            };
            productDetails.push({ ...detail, sourceId });
            const reviewCount = Math.floor(Math.random() * 5);
            for (let r = 0; r < reviewCount; r++) {
                const reviewAuthors = ['BookLover', 'ReadingFan', 'LiteratureEnthusiast', 'BookwormReader', 'NovelAddict'];
                const reviewTexts = [
                    'Absolutely captivating! Could not put it down.',
                    'Well-written with complex characters and engaging plot.',
                    'A masterpiece of storytelling. Highly recommended.',
                    'Great book, though the pacing was a bit slow in places.',
                    'Excellent character development and beautiful prose.',
                ];
                reviews.push({
                    sourceId,
                    author: `${getRandomElement(reviewAuthors)}${Math.floor(Math.random() * 1000)}`,
                    rating: Math.floor(Math.random() * 2) + 4,
                    text: getRandomElement(reviewTexts),
                    reviewDate: getRandomDate(new Date(2023, 0, 1), new Date()),
                    helpfulCount: Math.floor(Math.random() * 50),
                });
            }
        }
        if (products.length > 0) {
            const savedProducts = await productRepo.save(products);
            console.log(`Saved ${savedProducts.length} products in batch ${batch + 1}`);
            const detailsToSave = productDetails.map((detail, index) => ({
                ...detail,
                productId: savedProducts[index].id,
            }));
            await productDetailRepo.save(detailsToSave);
            const reviewsToSave = [];
            reviews.forEach(review => {
                const product = savedProducts.find(p => p.sourceId === review.sourceId);
                if (product) {
                    reviewsToSave.push({
                        ...review,
                        productId: product.id,
                    });
                }
            });
            if (reviewsToSave.length > 0) {
                await reviewRepo.save(reviewsToSave);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`Large dataset seeding completed! Created ${count} products.`);
}
if (require.main === module) {
    data_source_1.AppDataSource.initialize().then(async () => {
        try {
            const count = process.argv[2] ? parseInt(process.argv[2]) : 1200;
            await seedLargeDataset(data_source_1.AppDataSource, count);
            await data_source_1.AppDataSource.destroy();
            process.exit(0);
        }
        catch (error) {
            console.error('Error during large dataset seeding:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=seed-large-dataset.js.map