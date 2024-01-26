import jobVacancy from './job-vacancy'
import companyList from './company-list'

import path from 'node:path'
import fs from 'node:fs'

// #region status-checking
if (!process.env.EMAIL && !process.env.PASSWORD)
  throw Error('Invalid value from .env')
const authStatePath = path.resolve(
  __dirname,
  '..',
  'playwright',
  '.auth',
  'user.json'
)
fs.access(authStatePath, fs.constants.R_OK, (err) => {
  console.log(`${authStatePath} ${err ? 'is not readable' : 'is readable'}`)
})
// #endregion status-checking

;(async () => {
  // script start
  await jobVacancy
  await companyList
})()
