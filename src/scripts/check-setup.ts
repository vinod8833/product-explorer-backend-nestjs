

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

function checkCommand(command: string): boolean {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkFile(filePath: string): boolean {
  return existsSync(filePath);
}

async function checkSetup() {
  console.log(' Checking World of Books Scraping Setup\n');
  console.log('=' .repeat(50));

  let allGood = true;

  console.log('\n Node.js Environment:');
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(` Node.js: ${nodeVersion}`);
  } catch {
    console.log(' Node.js not found');
    allGood = false;
  }

  console.log('\n Package Manager:');
  if (checkCommand('npm --version')) {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(` npm: ${npmVersion}`);
  } else {
    console.log(' npm not found');
    allGood = false;
  }

  console.log('\n TypeScript:');
  if (checkCommand('npx tsc --version')) {
    const tsVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
    console.log(` TypeScript: ${tsVersion}`);
  } else {
    console.log(' TypeScript not found');
    allGood = false;
  }

  console.log('\n Playwright:');
  if (checkCommand('npx playwright --version')) {
    const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' }).trim();
    console.log(` Playwright: ${playwrightVersion}`);
  } else {
    console.log(' Playwright not found');
    allGood = false;
  }

  console.log('\n Playwright Browsers:');
  try {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    
    const playwrightCacheDir = path.join(os.homedir(), '.cache', 'ms-playwright');
    
    if (fs.existsSync(playwrightCacheDir)) {
      const browsers = fs.readdirSync(playwrightCacheDir);
      const hasChromium = browsers.some((dir: string) => dir.startsWith('chromium'));
      const hasFirefox = browsers.some((dir: string) => dir.startsWith('firefox'));
      
      if (hasChromium && hasFirefox) {
        console.log(' Browsers installed (Chromium, Firefox)');
      } else {
        console.log('  Some browsers missing - run: npx playwright install');
      }
    } else {
      console.log(' Browser cache directory not found - run: npx playwright install');
    }
  } catch {
    console.log(' Browser check failed - run: npx playwright install');
  }

  console.log('\n Project Files:');
  const requiredFiles = [
    'package.json',
    'src/modules/scraping/world-of-books-scraper.service.ts',
    'src/modules/scraping/world-of-books-api.service.ts',
    'src/modules/scraping/world-of-books-enhanced.service.ts',
    'src/modules/scraping/scraping.service.ts',
    'src/modules/scraping/scraping.controller.ts',
    'src/modules/scraping/scraping.processor.ts',
    'src/scripts/demo-scraping.ts',
    'src/scripts/test-scraping.ts',
  ];

  for (const file of requiredFiles) {
    if (checkFile(file)) {
      console.log(` ${file}`);
    } else {
      console.log(` ${file} - missing`);
      allGood = false;
    }
  }

  console.log('\n Dependencies:');
  try {
    const packageJson = require(join(process.cwd(), 'package.json'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      'crawlee',
      'playwright',
      '@nestjs/bull',
      'bull',
      'typeorm',
      '@nestjs/typeorm'
    ];

    for (const dep of requiredDeps) {
      if (deps[dep]) {
        console.log(` ${dep}: ${deps[dep]}`);
      } else {
        console.log(` ${dep} - missing`);
        allGood = false;
      }
    }
  } catch {
    console.log(' Could not read package.json');
    allGood = false;
  }

  console.log('\n Environment:');
  const envVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_URL'
  ];

  for (const envVar of envVars) {
    if (process.env[envVar]) {
      console.log(` ${envVar}: ${process.env[envVar]?.substring(0, 20)}...`);
    } else {
      console.log(`  ${envVar} - not set (optional)`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  if (allGood) {
    console.log(' Setup looks good! You can run:');
    console.log('   npm run demo:scraping    - Run the demo');
    console.log('   npm run test:scraping    - Run tests');
    console.log('   npm run start:dev        - Start the server');
  } else {
    console.log(' Setup issues found. Please fix the above errors.');
    console.log('\n Quick fixes:');
    console.log('   npm install              - Install dependencies');
    console.log('   npx playwright install   - Install browsers');
  }

  console.log('\n Documentation:');
  console.log('   Crawlee: https://crawlee.dev/');
  console.log('   Playwright: https://playwright.dev/');
  console.log('   NestJS: https://nestjs.com/');
}

if (require.main === module) {
  checkSetup().catch(console.error);
}

export { checkSetup };