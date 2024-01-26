import { chromium } from 'playwright'
import type { LaunchOptions, BrowserContextOptions } from '@playwright/test'
import type { JobVacancies } from './typing'

import fs from 'fs'
import path from 'path'
import { format } from '@fast-csv/format'

// Configurations
const launchOptions: LaunchOptions = {
  headless: true
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
  const outputPath = path.resolve(__dirname, '..', 'data', 'job-vacancy.csv')
  const writeStream = fs.createWriteStream(outputPath)
  const csvStream = format({ headers: true })
  // csvStream.pipe(process.stdout).on('end', () => process.exit())
  csvStream.pipe(writeStream)

  // #region job-vacancy
  await page.goto('https://careerportal.fsktm.um.edu.my/student/joblist')

  await page
    .getByText('JOB VACANCIES', { exact: true })
    .waitFor({ state: 'visible' })

  while (true) {
    // get current page detail
    const pagination = await page.getByRole('status').innerText()
    const pageInfo = getPageInfo(pagination)
    const progress = pageInfo!.currentPageEnd / pageInfo!.totalEntries
    // show current scraping progress indicator in console
    console.log(
      `[job-vacancy] Scraping in Progress [${(progress * 100).toFixed(
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
      const jsonData: JobVacancies = {
        num: parseInt(rowData[0]),
        title: rowData[1],
        description: rowData[2],
        requirement: rowData[3],
        closingDate: rowData[4],
        salary: rowData[5],
        contact: rowData[6]
      }

      csvStream.write(jsonData)
    }

    await page.locator('#mydatatable_next').click()
  }

  csvStream.end()

  console.log(`Saved file at ${outputPath}`)
  // #endregion job-vacancy

  // Close up
  await context.close()
  await browser.close()
})()

// Helpers
function getPageInfo(inputString: string) {
  // Define a regular expression pattern to extract current and last page numbers
  const regex = /Showing (\d+) to (\d+) of (\d+) entries/

  // Use the match method to extract information
  const match = inputString.match(regex)
  if (!match) return

  // Extracted information
  const currentPageStart = parseInt(match[1])
  const currentPageEnd = parseInt(match[2])
  const totalEntries = parseInt(match[3])
  return { currentPageStart, currentPageEnd, totalEntries }
}
