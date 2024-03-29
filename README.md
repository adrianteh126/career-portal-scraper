# Career Portal Scraper

## Description

This project is designed to automate the extraction of job vacancy listings and company information from the career portal of my university's faculty. The primary goal is to collect relevant data and store it in a CSV file for further analysis. The project utilizes web scraping tool  to extract job details and other relevant information.

## Run the Scripts

### Setup .env File

Copy and rename `example.env` to `.env` and fill in the information required.

### Generate Authenticated State

`npm run auth`

`yarn auth`

Refer : [Basic: shared account in all tests](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests)

### Run Scraping Scripts

`npm run start`

`yarn start`

### Playwright Code Generator

Generate authenticated state then start playwright code generator on-spot to target url.

`npm run codegen <target-url>`

`yarn start <target-url>`

Refer : [Running Codegen](https://playwright.dev/docs/codegen-intro)