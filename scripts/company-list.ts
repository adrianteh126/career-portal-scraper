import { chromium } from 'playwright'
import type { LaunchOptions, BrowserContextOptions } from '@playwright/test'
import type { CompanyList } from './typing'

import fs from 'fs'
import path from 'path'
import { format } from '@fast-csv/format'

// Configurations
const launchOptions: LaunchOptions = {
  headless: process.env.HEADLESS === 'true'
  // args: ['--start-maximized']
}
const browserContextOptions: BrowserContextOptions = {
  storageState: './playwright/.auth/user.json'
}

export default (async () => {
  // Initialize fixtures
  const browser = await chromium.launch(launchOptions)
  const context = await browser.newContext(browserContextOptions)
  const page = await context.newPage()

  // fast-csv configuration
  const outputPath = path.resolve(__dirname, '..', 'data', 'company-list.csv')
  const writeStream = fs.createWriteStream(outputPath)
  const csvStream = format({ headers: true })
  // csvStream.pipe(process.stdout).on('end', () => process.exit())
  csvStream.pipe(writeStream)

  // #region company-list
  await page.goto(
    'https://careerportal.fsktm.um.edu.my/student/senarai_company'
  )

  await page
    .getByText('COMPANY LIST', { exact: true })
    .waitFor({ state: 'visible' })

  while (true) {
    // get current page detail
    const pagination = await page.getByRole('status').innerText()
    const pageInfo = getPageInfo(pagination)
    const progress = pageInfo!.currentPageEnd / pageInfo!.totalEntries
    // show current scraping progress indicator in console
    console.log(
      `[company-list] Scraping in Progress [${(progress * 100).toFixed(
        2
      )} %] ${Array(Math.ceil(progress * 10))
        .fill('🚀')
        .join('')}`
    )

    if (
      pageInfo?.currentPageStart !== 1 &&
      pageInfo?.currentPageEnd === pageInfo?.totalEntries
    ) {
      break
    }

    // get all rows data in table
    const rows = page.locator('#mydatatable > tbody > tr')

    // process row by row, extracting the columns
    for (let i = 0; i < (await rows.count()); i++) {
      const row = rows.nth(i)

      const rowData: string[] = []
      // get columns from current row
      const cols = row.locator('td')
      for (let j = 0; j < (await cols.count()); j++) {
        // process col by col, extracting datas
        const col = cols.nth(j)

        const data = await col.innerText()
        rowData.push(data)
      }

      // destruct rowData to jsonData for processing
      const jsonData: CompanyList = {
        num: parseInt(rowData[0]),
        companyName: rowData[1],
        contactPerson: rowData[2],
        postcode: rowData[3],
        state: rowData[4],
        industryStatus: rowData[5]
      }

      csvStream.write(jsonData)
    }

    await page.locator('#mydatatable_next').click()
  }

  csvStream.end()

  console.log(`Saved file at ${outputPath}`)
  // #endregion company-list

  // Close up
  await context.close()
  await browser.close()
})()

// Helpers
function getPageInfo(inputString: string) {
  // Define a regular expression pattern to extract current and last page numbers
  const regex = /Showing ([\d,]+) to ([\d,]+) of ([\d,]+) entries/

  // Use the match method to extract information
  const match = inputString.match(regex)
  if (!match) return

  // Extracted information
  const currentPageStart = parseInt(match[1].replace(/,/g, ''))
  const currentPageEnd = parseInt(match[2].replace(/,/g, ''))
  const totalEntries = parseInt(match[3].replace(/,/g, ''))
  return { currentPageStart, currentPageEnd, totalEntries }
}
