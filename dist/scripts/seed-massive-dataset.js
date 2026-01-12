"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMassiveDataset = seedMassiveDataset;
const data_source_1 = require("../database/data-source");
const product_entity_1 = require("../database/entities/product.entity");
const product_detail_entity_1 = require("../database/entities/product-detail.entity");
const review_entity_1 = require("../database/entities/review.entity");
const BOOK_CATALOG = [
    { title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", genre: "Classic Literature" },
    { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "9780141441146", genre: "Classic Literature" },
    { title: "Wuthering Heights", author: "Emily Brontë", isbn: "9780141439556", genre: "Classic Literature" },
    { title: "Great Expectations", author: "Charles Dickens", isbn: "9780141439563", genre: "Classic Literature" },
    { title: "Oliver Twist", author: "Charles Dickens", isbn: "9780141439747", genre: "Classic Literature" },
    { title: "A Tale of Two Cities", author: "Charles Dickens", isbn: "9780141439600", genre: "Classic Literature" },
    { title: "David Copperfield", author: "Charles Dickens", isbn: "9780141439587", genre: "Classic Literature" },
    { title: "Emma", author: "Jane Austen", isbn: "9780141439587", genre: "Classic Literature" },
    { title: "Sense and Sensibility", author: "Jane Austen", isbn: "9780141439662", genre: "Classic Literature" },
    { title: "Mansfield Park", author: "Jane Austen", isbn: "9780141439808", genre: "Classic Literature" },
    { title: "The Handmaid's Tale", author: "Margaret Atwood", isbn: "9780385490818", genre: "Dystopian Fiction" },
    { title: "Beloved", author: "Toni Morrison", isbn: "9781400033416", genre: "Literary Fiction" },
    { title: "The Kite Runner", author: "Khaled Hosseini", isbn: "9781594631931", genre: "Literary Fiction" },
    { title: "Life of Pi", author: "Yann Martel", isbn: "9780156027328", genre: "Adventure Fiction" },
    { title: "The Book Thief", author: "Markus Zusak", isbn: "9780375842207", genre: "Historical Fiction" },
    { title: "Never Let Me Go", author: "Kazuo Ishiguro", isbn: "9781400078776", genre: "Science Fiction" },
    { title: "The Remains of the Day", author: "Kazuo Ishiguro", isbn: "9780679731726", genre: "Literary Fiction" },
    { title: "Atonement", author: "Ian McEwan", isbn: "9780385721790", genre: "Literary Fiction" },
    { title: "The Curious Incident of the Dog in the Night-Time", author: "Mark Haddon", isbn: "9781400032716", genre: "Mystery" },
    { title: "Cloud Atlas", author: "David Mitchell", isbn: "9780375507250", genre: "Science Fiction" },
    { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", genre: "Science Fiction" },
    { title: "Foundation", author: "Isaac Asimov", isbn: "9780553293357", genre: "Science Fiction" },
    { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", isbn: "9780345391803", genre: "Science Fiction" },
    { title: "Ender's Game", author: "Orson Scott Card", isbn: "9780812550702", genre: "Science Fiction" },
    { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", isbn: "9780441478125", genre: "Science Fiction" },
    { title: "Neuromancer", author: "William Gibson", isbn: "9780441569595", genre: "Cyberpunk" },
    { title: "The Lord of the Rings", author: "J.R.R. Tolkien", isbn: "9780544003415", genre: "Fantasy" },
    { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", genre: "Fantasy" },
    { title: "A Game of Thrones", author: "George R.R. Martin", isbn: "9780553103540", genre: "Fantasy" },
    { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404079", genre: "Fantasy" },
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "9780307454546", genre: "Mystery" },
    { title: "Gone Girl", author: "Gillian Flynn", isbn: "9780307588364", genre: "Psychological Thriller" },
    { title: "The Da Vinci Code", author: "Dan Brown", isbn: "9780307474278", genre: "Thriller" },
    { title: "In the Woods", author: "Tana French", isbn: "9780143113492", genre: "Mystery" },
    { title: "The Big Sleep", author: "Raymond Chandler", isbn: "9780394758282", genre: "Detective Fiction" },
    { title: "And Then There Were None", author: "Agatha Christie", isbn: "9780062073488", genre: "Mystery" },
    { title: "Murder on the Orient Express", author: "Agatha Christie", isbn: "9780062693662", genre: "Mystery" },
    { title: "The Maltese Falcon", author: "Dashiell Hammett", isbn: "9780679722649", genre: "Detective Fiction" },
    { title: "The Silence of the Lambs", author: "Thomas Harris", isbn: "9780312924584", genre: "Thriller" },
    { title: "Red Dragon", author: "Thomas Harris", isbn: "9780425228227", genre: "Thriller" },
    { title: "Outlander", author: "Diana Gabaldon", isbn: "9780440212560", genre: "Historical Romance" },
    { title: "Me Before You", author: "Jojo Moyes", isbn: "9780143124542", genre: "Contemporary Romance" },
    { title: "The Notebook", author: "Nicholas Sparks", isbn: "9780446676090", genre: "Romance" },
    { title: "The Time Traveler's Wife", author: "Audrey Niffenegger", isbn: "9780156029438", genre: "Romance" },
    { title: "Eleanor Oliphant Is Completely Fine", author: "Gail Honeyman", isbn: "9780735220683", genre: "Contemporary Fiction" },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", genre: "History" },
    { title: "Educated", author: "Tara Westover", isbn: "9780399590504", genre: "Memoir" },
    { title: "Becoming", author: "Michelle Obama", isbn: "9781524763138", genre: "Memoir" },
    { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", isbn: "9781400052189", genre: "Science" },
    { title: "Quiet", author: "Susan Cain", isbn: "9780307352156", genre: "Psychology" },
    { title: "The Power of Habit", author: "Charles Duhigg", isbn: "9780812981605", genre: "Self-Help" },
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "9780374533557", genre: "Psychology" },
    { title: "The Lean Startup", author: "Eric Ries", isbn: "9780307887894", genre: "Business" },
    { title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", genre: "Biography" },
    { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", isbn: "9781451639612", genre: "Self-Help" },
    { title: "The Hunger Games", author: "Suzanne Collins", isbn: "9780439023528", genre: "Young Adult" },
    { title: "Divergent", author: "Veronica Roth", isbn: "9780062024039", genre: "Young Adult" },
    { title: "The Fault in Our Stars", author: "John Green", isbn: "9780525478812", genre: "Young Adult" },
    { title: "Looking for Alaska", author: "John Green", isbn: "9780142402511", genre: "Young Adult" },
    { title: "Thirteen Reasons Why", author: "Jay Asher", isbn: "9781595141712", genre: "Young Adult" },
    { title: "The Perks of Being a Wallflower", author: "Stephen Chbosky", isbn: "9781451696196", genre: "Young Adult" },
    { title: "Eleanor & Park", author: "Rainbow Rowell", isbn: "9781250012579", genre: "Young Adult" },
    { title: "The Maze Runner", author: "James Dashner", isbn: "9780385737951", genre: "Young Adult" },
    { title: "The Shining", author: "Stephen King", isbn: "9780307743657", genre: "Horror" },
    { title: "It", author: "Stephen King", isbn: "9781501142970", genre: "Horror" },
    { title: "Pet Sematary", author: "Stephen King", isbn: "9780307743688", genre: "Horror" },
    { title: "The Stand", author: "Stephen King", isbn: "9780307743688", genre: "Horror" },
    { title: "Carrie", author: "Stephen King", isbn: "9780307743664", genre: "Horror" },
    { title: "Dracula", author: "Bram Stoker", isbn: "9780141439846", genre: "Gothic Horror" },
    { title: "Frankenstein", author: "Mary Shelley", isbn: "9780141439471", genre: "Gothic Horror" },
    { title: "The Strange Case of Dr. Jekyll and Mr. Hyde", author: "Robert Louis Stevenson", isbn: "9780141439730", genre: "Gothic Horror" },
    { title: "All Quiet on the Western Front", author: "Erich Maria Remarque", isbn: "9780449213940", genre: "Historical Fiction" },
    { title: "The Pillars of the Earth", author: "Ken Follett", isbn: "9780451166890", genre: "Historical Fiction" },
    { title: "Gone with the Wind", author: "Margaret Mitchell", isbn: "9781451635621", genre: "Historical Fiction" },
    { title: "The Other Boleyn Girl", author: "Philippa Gregory", isbn: "9780743227445", genre: "Historical Fiction" },
    { title: "Cold Mountain", author: "Charles Frazier", isbn: "9780802142849", genre: "Historical Fiction" },
    { title: "Memoirs of a Geisha", author: "Arthur Golden", isbn: "9780679781585", genre: "Historical Fiction" },
    { title: "The Help", author: "Kathryn Stockett", isbn: "9780425232200", genre: "Historical Fiction" },
    { title: "Water for Elephants", author: "Sara Gruen", isbn: "9781565125605", genre: "Historical Fiction" },
    { title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415", genre: "Philosophy" },
    { title: "Siddhartha", author: "Hermann Hesse", isbn: "9780553208849", genre: "Philosophy" },
    { title: "The Prophet", author: "Kahlil Gibran", isbn: "9780394404288", genre: "Philosophy" },
    { title: "Man's Search for Meaning", author: "Viktor E. Frankl", isbn: "9780807014295", genre: "Philosophy" },
    { title: "The Art of War", author: "Sun Tzu", isbn: "9781599869773", genre: "Philosophy" },
    { title: "Charlotte's Web", author: "E.B. White", isbn: "9780064400558", genre: "Children's Literature" },
    { title: "Where the Wild Things Are", author: "Maurice Sendak", isbn: "9780060254926", genre: "Children's Literature" },
    { title: "The Giving Tree", author: "Shel Silverstein", isbn: "9780060256654", genre: "Children's Literature" },
    { title: "Matilda", author: "Roald Dahl", isbn: "9780142410370", genre: "Children's Literature" },
    { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", isbn: "9780142410318", genre: "Children's Literature" },
    { title: "The BFG", author: "Roald Dahl", isbn: "9780142410387", genre: "Children's Literature" },
    { title: "James and the Giant Peach", author: "Roald Dahl", isbn: "9780142410363", genre: "Children's Literature" },
    { title: "The Cat in the Hat", author: "Dr. Seuss", isbn: "9780394800011", genre: "Children's Literature" },
    { title: "Green Eggs and Ham", author: "Dr. Seuss", isbn: "9780394800165", genre: "Children's Literature" },
    { title: "Oh, the Places You'll Go!", author: "Dr. Seuss", isbn: "9780679805274", genre: "Children's Literature" },
    { title: "Leaves of Grass", author: "Walt Whitman", isbn: "9780486456768", genre: "Poetry" },
    { title: "The Waste Land", author: "T.S. Eliot", isbn: "9780156948777", genre: "Poetry" },
    { title: "The Road Not Taken", author: "Robert Frost", isbn: "9780805005031", genre: "Poetry" },
    { title: "Howl and Other Poems", author: "Allen Ginsberg", isbn: "9780872860179", genre: "Poetry" },
    { title: "Ariel", author: "Sylvia Plath", isbn: "9780060732608", genre: "Poetry" },
    { title: "The Goldfinch", author: "Donna Tartt", isbn: "9780316055437", genre: "Literary Fiction" },
    { title: "A Little Life", author: "Hanya Yanagihara", isbn: "9780804172707", genre: "Literary Fiction" },
    { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn: "9781501161933", genre: "Contemporary Fiction" },
    { title: "Where the Crawdads Sing", author: "Delia Owens", isbn: "9780735219090", genre: "Mystery" },
    { title: "Normal People", author: "Sally Rooney", isbn: "9781984822178", genre: "Literary Fiction" },
    { title: "Circe", author: "Madeline Miller", isbn: "9780316556347", genre: "Mythology" },
    { title: "The Song of Achilles", author: "Madeline Miller", isbn: "9780062060624", genre: "Mythology" },
    { title: "Klara and the Sun", author: "Kazuo Ishiguro", isbn: "9780593318171", genre: "Science Fiction" },
    { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", genre: "Fantasy" },
    { title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", genre: "Science Fiction" },
    { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", isbn: "9780060883287", genre: "Magical Realism" },
    { title: "The Metamorphosis", author: "Franz Kafka", isbn: "9780486290300", genre: "Existential Fiction" },
    { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "9780486415871", genre: "Russian Literature" },
    { title: "War and Peace", author: "Leo Tolstoy", isbn: "9780486411699", genre: "Russian Literature" },
    { title: "Anna Karenina", author: "Leo Tolstoy", isbn: "9780486437965", genre: "Russian Literature" },
    { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", isbn: "9780486437910", genre: "Russian Literature" },
    { title: "Don Quixote", author: "Miguel de Cervantes", isbn: "9780486434094", genre: "Spanish Literature" },
    { title: "Madame Bovary", author: "Gustave Flaubert", isbn: "9780486292571", genre: "French Literature" },
    { title: "Les Misérables", author: "Victor Hugo", isbn: "9780486457895", genre: "French Literature" },
    { title: "The Count of Monte Cristo", author: "Alexandre Dumas", isbn: "9780486456430", genre: "French Literature" },
];
const PUBLISHERS = [
    "Penguin Classics", "Random House", "HarperCollins", "Simon & Schuster",
    "Macmillan", "Vintage Books", "Doubleday", "Knopf", "Bantam", "Dell",
    "Tor Books", "Orbit", "Ace Books", "DAW Books", "Baen Books",
    "Oxford University Press", "Cambridge University Press", "Yale University Press",
    "Scholastic", "Little, Brown and Company", "Houghton Mifflin Harcourt"
];
const CATEGORY_MAPPING = {
    "Classic Literature": 1,
    "Literary Fiction": 1,
    "Contemporary Fiction": 1,
    "Historical Fiction": 1,
    "Science Fiction": 3,
    "Fantasy": 7,
    "Mystery": 1,
    "Thriller": 1,
    "Romance": 2,
    "Young Adult": 10,
    "Horror": 1,
    "Non-Fiction": 6,
    "Biography": 6,
    "Memoir": 6,
    "Self-Help": 9,
    "Business": 6,
    "Psychology": 6,
    "Philosophy": 6,
    "Poetry": 1,
    "Children's Literature": 10,
    "History": 6,
    "Science": 6
};
function getRandomPrice() {
    return parseFloat((Math.random() * 30 + 5).toFixed(2));
}
function getRandomDate() {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function getRandomPublisher() {
    return PUBLISHERS[Math.floor(Math.random() * PUBLISHERS.length)];
}
function getRandomPageCount() {
    return Math.floor(Math.random() * 800) + 100;
}
function getRandomRating() {
    return parseFloat((Math.random() * 2 + 3).toFixed(2));
}
function getRandomReviewCount() {
    return Math.floor(Math.random() * 1000) + 10;
}
function generateImageUrl(title, isbn, sourceId) {
    if (Math.random() < 0.7 && isbn) {
        return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    }
    if (Math.random() < 0.2 && isbn) {
        const size = Math.random() < 0.5 ? 'L' : 'S';
        return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
    }
    const cleanTitle = title.slice(0, 15).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
    return `https://dummyimage.com/300x400/4a5568/ffffff&text=${cleanTitle}`;
}
async function seedMassiveDataset() {
    console.log('Starting massive dataset seeding...');
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const productRepository = data_source_1.AppDataSource.getRepository(product_entity_1.Product);
        const productDetailRepository = data_source_1.AppDataSource.getRepository(product_detail_entity_1.ProductDetail);
        const reviewRepository = data_source_1.AppDataSource.getRepository(review_entity_1.Review);
        console.log(' Cleraring existing data...');
        console.log(' Clearing existing data...');
        const existingProducts = await productRepository.find({ select: ['id'] });
        if (existingProducts.length > 0) {
            const productIds = existingProducts.map(p => p.id);
            await reviewRepository
                .createQueryBuilder()
                .delete()
                .where('productId IN (:...ids)', { ids: productIds })
                .execute();
            await productDetailRepository
                .createQueryBuilder()
                .delete()
                .where('productId IN (:...ids)', { ids: productIds })
                .execute();
            await productRepository
                .createQueryBuilder()
                .delete()
                .where('id IN (:...ids)', { ids: productIds })
                .execute();
            console.log(` Cleared ${existingProducts.length} existing products`);
        }
        const TARGET_COUNT = 2500;
        const BATCH_SIZE = 100;
        let totalCreated = 0;
        console.log(` Generating ${TARGET_COUNT} books in batches of ${BATCH_SIZE}...`);
        for (let batch = 0; batch < Math.ceil(TARGET_COUNT / BATCH_SIZE); batch++) {
            const batchStart = batch * BATCH_SIZE;
            const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
            const batchSize = batchEnd - batchStart;
            console.log(` Processing batch ${batch + 1}: books ${batchStart + 1}-${batchEnd}`);
            const productsToCreate = [];
            for (let i = 0; i < batchSize; i++) {
                const bookIndex = Math.floor(Math.random() * BOOK_CATALOG.length);
                const book = BOOK_CATALOG[bookIndex];
                const sourceId = `book-${batchStart + i + 1}`;
                let title = book.title;
                let isbn = book.isbn;
                if (Math.random() < 0.15) {
                    const editions = [
                        "Deluxe Edition", "Anniversary Edition", "Collector's Edition",
                        "Paperback Edition", "Hardcover Edition", "Special Edition",
                        "Revised Edition", "Updated Edition", "Complete Edition"
                    ];
                    const edition = editions[Math.floor(Math.random() * editions.length)];
                    title = `${book.title} (${edition})`;
                    const baseIsbn = book.isbn.replace(/[^0-9]/g, '');
                    const lastDigit = parseInt(baseIsbn.slice(-1));
                    const newLastDigit = (lastDigit + Math.floor(Math.random() * 9) + 1) % 10;
                    isbn = baseIsbn.slice(0, -1) + newLastDigit.toString();
                    isbn = `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 6)}-${isbn.slice(6, 12)}-${isbn.slice(12)}`;
                }
                const categoryId = CATEGORY_MAPPING[book.genre] || 1;
                const imageUrl = generateImageUrl(title, isbn, sourceId);
                const product = new product_entity_1.Product();
                product.sourceId = sourceId;
                product.categoryId = categoryId;
                product.title = title;
                product.author = book.author;
                product.price = getRandomPrice();
                product.currency = 'GBP';
                product.imageUrl = imageUrl;
                product.sourceUrl = `https://www.worldofbooks.com/en-gb/book/${sourceId}`;
                product.inStock = Math.random() > 0.1;
                product.lastScrapedAt = getRandomDate();
                productsToCreate.push(product);
            }
            const createdProducts = await productRepository.save(productsToCreate);
            const detailsToCreate = createdProducts.map(product => {
                const bookData = BOOK_CATALOG.find(b => product.title.includes(b.title));
                const detail = new product_detail_entity_1.ProductDetail();
                detail.productId = product.id;
                detail.description = `${bookData?.genre || 'Fiction'} ${product.title.includes('Edition') ? 'edition' : 'novel'} by ${product.author}. ${product.title} is a compelling read that has captivated readers worldwide.`;
                detail.ratingsAvg = getRandomRating();
                detail.reviewsCount = getRandomReviewCount();
                detail.publisher = getRandomPublisher();
                detail.publicationDate = getRandomDate();
                detail.isbn = bookData?.isbn || `978${Math.floor(Math.random() * 1000000000)}`;
                detail.pageCount = getRandomPageCount();
                detail.genres = [bookData?.genre || 'Fiction'];
                return detail;
            });
            await productDetailRepository.save(detailsToCreate);
            totalCreated += createdProducts.length;
            console.log(` Batch ${batch + 1} completed: ${createdProducts.length} products created (Total: ${totalCreated})`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const finalCount = await productRepository.count();
        const categoryCounts = await productRepository
            .createQueryBuilder('product')
            .select('product.categoryId', 'categoryId')
            .addSelect('COUNT(product.id)', 'count')
            .groupBy('product.categoryId')
            .getRawMany();
        const uniqueTitles = await productRepository
            .createQueryBuilder('product')
            .select('DISTINCT product.title', 'title')
            .getRawMany();
        const uniqueAuthors = await productRepository
            .createQueryBuilder('product')
            .select('DISTINCT product.author', 'author')
            .getRawMany();
        console.log('\n Massive dataset seeding completed!');
        console.log(` Statistics:`);
        console.log(`   Total products: ${finalCount}`);
        console.log(`   Unique titles: ${uniqueTitles.length}`);
        console.log(`   Unique authors: ${uniqueAuthors.length}`);
        console.log(`   Diversity ratio: ${((uniqueTitles.length / finalCount) * 100).toFixed(1)}%`);
        console.log(`   Categories distribution:`);
        for (const cat of categoryCounts) {
            console.log(`     Category ${cat.categoryId}: ${cat.count} products`);
        }
        const imageUrlSamples = await productRepository.find({
            select: ['imageUrl'],
            take: 100,
        });
        const openLibraryCount = imageUrlSamples.filter(p => p.imageUrl.includes('covers.openlibrary.org')).length;
        const dummyImageCount = imageUrlSamples.filter(p => p.imageUrl.includes('dummyimage.com')).length;
        console.log(`   Image sources (sample of 100):`);
        console.log(`     Open Library: ${openLibraryCount}%`);
        console.log(`     Dummy Images: ${dummyImageCount}%`);
    }
    catch (error) {
        console.error(' Error seeding massive dataset:', error);
        throw error;
    }
    finally {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
        }
    }
}
if (require.main === module) {
    seedMassiveDataset()
        .then(() => {
        console.log(' Massive dataset seeding completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error(' Massive dataset seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed-massive-dataset.js.map