import { chromium } from 'playwright'
import type { LaunchOptions } from '@playwright/test'

import path from 'path'

// Environment variables
const email: string = process.env.EMAIL!
const password: string = process.env.PASSWORD!

// save to '../playwright/.auth/user.json'
const authFilePath = path.resolve(
  __dirname,
  '..',
  'playwright',
  '.auth',
  'user.json'
)

export default (async () => {
  // Configurations
  const launchOptions: LaunchOptions = {
    headless: process.env.HEADLESS === 'true'
  }

  // Initialize fixtures
  const browser = await chromium.launch(launchOptions)
  const context = await browser.newContext()
  const page = await context.newPage()

  // #region setup-authentication
  await page.goto('https://careerportal.fsktm.um.edu.my/')
  await page.getByRole('link', { name: ' Sign in' }).click()
  await page.getByPlaceholder('E-Mail address').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.getByRole('link', { name: ' Dashboard Student' }).click()

  await page
    .getByText('DASHBOARD', { exact: true })
    .waitFor({ state: 'visible' })

  await page.context().storageState({ path: authFilePath })

  console.log('🔐 Auth done!')
  // #endregion setup-authentication

  // Close up
  await context.close()
  await browser.close()
})()
