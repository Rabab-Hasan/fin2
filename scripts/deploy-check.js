#!/usr/bin/env node
/**
 * DigitalOcean Deployment Preparation Script
 * Run this script before deploying to verify all configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DigitalOcean App Platform Deployment Checker\n');

const checks = [
  {
    name: 'Backend package.json exists',
    check: () => fs.existsSync('backend/package.json'),
    fix: 'Ensure backend/package.json exists with proper dependencies'
  },
  {
    name: 'Frontend package.json exists', 
    check: () => fs.existsSync('frontend/package.json'),
    fix: 'Ensure frontend/package.json exists with build scripts'
  },
  {
    name: 'Backend .env.example exists',
    check: () => fs.existsSync('backend/.env.example'),
    fix: 'Create backend/.env.example with required environment variables'
  },
  {
    name: 'Frontend .env.example exists',
    check: () => fs.existsSync('frontend/.env.example'),
    fix: 'Create frontend/.env.example with React app environment variables'
  },
  {
    name: 'Procfile exists',
    check: () => fs.existsSync('Procfile'),
    fix: 'Create Procfile with deployment commands'
  },
  {
    name: 'Backend has production start script',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('backend/package.json'));
        return pkg.scripts && pkg.scripts.start;
      } catch { return false; }
    },
    fix: 'Add "start": "node src/server.js" to backend package.json scripts'
  },
  {
    name: 'Frontend has build script',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('frontend/package.json'));
        return pkg.scripts && pkg.scripts.build;
      } catch { return false; }
    },
    fix: 'Add build script to frontend package.json'
  },
  {
    name: 'Server uses process.env.PORT',
    check: () => {
      try {
        const server = fs.readFileSync('backend/src/server.js', 'utf8');
        return server.includes('process.env.PORT');
      } catch { return false; }
    },
    fix: 'Update server.js to use process.env.PORT || defaultPort'
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check, fix }) => {
  const result = check();
  if (result) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Fix: ${fix}\n`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Ready for DigitalOcean deployment.');
  console.log('\nNext steps:');
  console.log('1. Create app in DigitalOcean App Platform');
  console.log('2. Connect your GitHub repository');  
  console.log('3. Configure environment variables');
  console.log('4. Deploy!');
} else {
  console.log('\n⚠️  Please fix the failed checks before deploying.');
  process.exit(1);
}