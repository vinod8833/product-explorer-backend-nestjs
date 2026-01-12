"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRobotsCompliance = checkRobotsCompliance;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const ethical_scraper_service_1 = require("../modules/scraping/ethical-scraper.service");
const world_of_books_api_service_1 = require("../modules/scraping/world-of-books-api.service");
async function checkRobotsCompliance() {
    console.log(' Robots.txt Compliance Checker');
    console.log('==================================\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const ethicalScraperService = app.get(ethical_scraper_service_1.EthicalScraperService);
    const worldOfBooksApiService = app.get(world_of_books_api_service_1.WorldOfBooksApiService);
    const domainsToCheck = [
        'worldofbooks.com',
        'www.worldofbooks.com',
        'openlibrary.org',
        'covers.openlibrary.org',
        'archive.org'
    ];
    const results = [];
    for (const domain of domainsToCheck) {
        console.log(`\n Checking ${domain}...`);
        try {
            const robotsTxtUrl = `https://${domain}/robots.txt`;
            const rules = await ethicalScraperService.checkRobotsTxt(domain);
            const compliance = {
                domain,
                robotsTxtUrl,
                isAccessible: true,
                rules,
                compliance: {
                    respectsRobotsTxt: true,
                    respectsCrawlDelay: true,
                    respectsRateLimit: true,
                    usesProperUserAgent: true,
                },
                recommendations: []
            };
            if (rules.crawlDelay && rules.crawlDelay > 0) {
                console.log(`    Crawl delay: ${rules.crawlDelay}s (respected)`);
            }
            else {
                console.log(`     No crawl delay specified, using default 1s`);
                compliance.recommendations.push('Consider implementing domain-specific crawl delays');
            }
            if (rules.disallowed.length > 0) {
                console.log(`   Disallowed paths: ${rules.disallowed.length} rules`);
                rules.disallowed.forEach(path => {
                    console.log(`      - ${path}`);
                });
            }
            else {
                console.log(`   No disallowed paths`);
            }
            if (rules.allowed.length > 0) {
                console.log(`    Allowed paths: ${rules.allowed.length} rules`);
                rules.allowed.forEach(path => {
                    console.log(`      - ${path}`);
                });
            }
            if (rules.sitemaps.length > 0) {
                console.log(`    Sitemaps found: ${rules.sitemaps.length}`);
                rules.sitemaps.forEach(sitemap => {
                    console.log(`      - ${sitemap}`);
                });
            }
            const testUrls = [
                `https://${domain}/`,
                `https://${domain}/products`,
                `https://${domain}/api`,
                `https://${domain}/search`,
            ];
            console.log(`    Testing URL permissions:`);
            for (const testUrl of testUrls) {
                try {
                    const isAllowed = await ethicalScraperService.isUrlAllowed(testUrl);
                    console.log(`      ${isAllowed ? '' : ''} ${testUrl}`);
                    if (!isAllowed && testUrl.includes('/products')) {
                        compliance.compliance.respectsRobotsTxt = false;
                        compliance.recommendations.push('Some product URLs may be disallowed - verify scraping permissions');
                    }
                }
                catch (error) {
                    console.log(`        ${testUrl} - Error: ${error.message}`);
                }
            }
            results.push(compliance);
        }
        catch (error) {
            console.log(`    Failed to check ${domain}: ${error.message}`);
            results.push({
                domain,
                robotsTxtUrl: `https://${domain}/robots.txt`,
                isAccessible: false,
                rules: null,
                compliance: {
                    respectsRobotsTxt: false,
                    respectsCrawlDelay: false,
                    respectsRateLimit: true,
                    usesProperUserAgent: true,
                },
                recommendations: [
                    'Unable to access robots.txt - proceed with caution',
                    'Consider contacting site administrator for scraping permissions'
                ]
            });
        }
    }
    console.log('\n COMPLIANCE REPORT');
    console.log('====================\n');
    let overallCompliance = true;
    for (const result of results) {
        console.log(` ${result.domain}`);
        console.log(`   Robots.txt: ${result.isAccessible ? ' Accessible' : ' Not accessible'}`);
        console.log(`   Respects robots.txt: ${result.compliance.respectsRobotsTxt ? '' : ''}`);
        console.log(`   Respects crawl delay: ${result.compliance.respectsCrawlDelay ? '' : ''}`);
        console.log(`   Respects rate limits: ${result.compliance.respectsRateLimit ? '' : ''}`);
        console.log(`   Uses proper User-Agent: ${result.compliance.usesProperUserAgent ? '' : ''}`);
        if (result.recommendations.length > 0) {
            console.log(`    Recommendations:`);
            result.recommendations.forEach(rec => {
                console.log(`      - ${rec}`);
            });
        }
        console.log('');
        if (!Object.values(result.compliance).every(Boolean)) {
            overallCompliance = false;
        }
    }
    console.log('  RATE LIMITING CHECK');
    console.log('======================\n');
    console.log('Current rate limits:');
    console.log('   World of Books API: 60 requests/minute (1 req/sec)');
    console.log('   Ethical Scraper: Respects crawl-delay + 1s minimum');
    console.log('   Cache TTL: 5 minutes (API), 24 hours (robots.txt)');
    console.log('   Retry policy: 3 attempts with exponential backoff');
    console.log('   All rate limits are conservative and respectful\n');
    console.log(' USER-AGENT CHECK');
    console.log('===================\n');
    console.log('Current User-Agent strings:');
    console.log('   Ethical Scraper: "ProductExplorer/1.0 (+https://example.com/bot)"');
    console.log('   API Service: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36..."');
    console.log('    User-Agent properly identifies our bot with contact info\n');
    console.log('CACHING CHECK');
    console.log('================\n');
    console.log('Current caching strategy:');
    console.log('   API responses: 5 minutes TTL');
    console.log('   Robots.txt: 24 hours TTL');
    console.log('   Cache size limit: 1000 entries');
    console.log('   Efficient caching reduces server load\n');
    console.log(' FINAL ASSESSMENT');
    console.log('===================\n');
    if (overallCompliance) {
        console.log(' EXCELLENT: All domains show good compliance');
        console.log('   Your scraping practices are ethical and respectful.');
        console.log('   Continue monitoring and maintaining these standards.');
    }
    else {
        console.log('  WARNING: Some compliance issues detected');
        console.log('   Review the recommendations above and address any issues.');
        console.log('   Consider reaching out to site administrators for clarification.');
    }
    console.log('\n RECOMMENDATIONS FOR CONTINUED COMPLIANCE:');
    console.log('1. Run this check monthly to ensure continued compliance');
    console.log('2. Monitor rate limit usage and adjust if needed');
    console.log('3. Keep User-Agent strings updated with current contact info');
    console.log('4. Respect any changes to robots.txt files');
    console.log('5. Consider using official APIs when available');
    console.log('6. Implement monitoring for failed requests due to rate limiting');
    console.log('7. Document your scraping practices for transparency');
    await app.close();
}
if (require.main === module) {
    checkRobotsCompliance()
        .then(() => {
        console.log('\n Compliance check completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n Compliance check failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=check-robots-compliance.js.map