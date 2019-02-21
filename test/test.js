// this library
const CUIC = require('../src/index.js')
// load config
require('dotenv').load()

// start tests
describe(`Test Security Permissions operations`, () => {

  // create CUIC client to our CUIC
  let client = new CUIC({
    host: process.env.HOST,
    username: process.env.USERNAME,
    domain: process.env.DOMAIN,
    password: process.env.PASSWORD
  })

  // it(`should get list of reports`, async function () {
  //   const results = await client.getReports()
  //   console.log('found', results.length, 'reports')
  //   return results
  // })
  //
  // it(`should get list of report definitions`, async function () {
  //   const results = await client.getReportDefinitions()
  //   console.log('found', results.length, 'report definitions')
  //   return results
  // })
  //
  // it(`should get list of dashboards`, async function () {
  //   const results = await client.getDashboards()
  //   console.log('found', results.length, 'dashboards')
  //   return results
  // })
  //
  // it(`should get list of value lists`, async function () {
  //   const results = await client.getValueLists()
  //   console.log('found', results.length, 'value lists')
  //   return results
  // })
  //
  // it(`should get list of collections`, async function () {
  //   const results = await client.getCollections()
  //   console.log('found', results.length, 'collections')
  //   return results
  // })
  //
  // it(`should get list of system collections`, async function () {
  //   const results = await client.getSystemCollections()
  //   console.log('found', results.length, 'system collections')
  //   return results
  // })
  //
  it(`should get list of users and groups`, async function () {
    const results = await client.getUsersAndGroups()
    // console.log('results', results)
    console.log('found', results.users.length, 'users and', results.groups.length, 'groups')
    return results
  })
})
