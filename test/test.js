// this library
const CUIC = require('../src/index.js')
// load config
require('dotenv').load()

const config = {
  userId: '8B78321E10000161000003B139ED7AF1',
  groupId: '2222222222222222222222222222BBBB',
  reportId: '81D1F50E10000132146C556B0A4E5BC4',
  reportFolderId: 'CCCCCCCC11111111AAAAAAAA00000005',
  reportDefinitionId: '81D0CB98100001327BFAFA800A4E5BC4',
  reportDefinitionFolderId: 'CCCCCCCC11111111AAAAAAAA00000004',
  dataSourceId: 'CCCCCCCC00000000AAAAAAAA00000001',
  dashboardId: 'AD2BA25F100001590000003F39ED7AF1',
  dashboardFolderId: 'CCCCCCCC11111111AAAAAAAA00000001',
  valueListId: 'CCCCCCCC00000000DDDDDDDD00000003',
  collectionId: '',
  systemCollectionId: '8B7832D610000161000003C339ED7AF1'
}
// create CUIC client to our CUIC
const client = new CUIC({
  host: process.env.HOST,
  username: process.env.USERNAME,
  domain: process.env.DOMAIN,
  password: process.env.PASSWORD
})

// start OAMP tests
describe(`Test OAMP operations`, () => {
  it(`should start sync of CCE supervisor agent accounts`, async function () {
    return client.syncCceSupervisors()
  })
})

// start CUIC UI tests
describe(`Test Security Permissions operations`, () => {
  /***********
   * Getters *
   ***********/
  /* list objects */
  it(`should get list of reports`, async function () {
    const results = await client.getReports()
    console.log('found', results.length, 'reports')
    return results
  })

  it(`should get list of report definitions`, async function () {
    const results = await client.getReportDefinitions()
    console.log('found', results.length, 'report definitions')
    return results
  })

  it(`should get list of dashboards`, async function () {
    const results = await client.getDashboards()
    console.log('found', results.length, 'dashboards')
    return results
  })

  it(`should get list of value lists`, async function () {
    const results = await client.getValueLists()
    console.log('found', results.length, 'value lists')
    return results
  })

  it(`should get list of collections`, async function () {
    const results = await client.getCollections()
    console.log('found', results.length, 'collections')
    return results
  })

  it(`should get list of system collections`, async function () {
    const results = await client.getSystemCollections()
    console.log('found', results.length, 'system collections')
    return results
  })

  it(`should get list of users and groups`, async function () {
    const results = await client.getUsersAndGroups()
    // console.log('results', results)
    console.log('found', results.users.length, 'users and', results.groups.length, 'groups')
    return results
  })

  /* user permissions */
  it(`should get user permissions for a report`, async function () {
    return client.getReportUserPermissions(config.reportId)
  })
  it(`should get user permissions for a report folder`, async function () {
    return client.getReportFolderUserPermissions(config.reportFolderId)
  })
  it(`should get user permissions for a report definition`, async function () {
    return client.getReportDefinitionUserPermissions(config.reportDefinitionId)
  })
  it(`should get user permissions for a report definition folder`, async function () {
    return client.getReportDefinitionFolderUserPermissions(config.reportDefinitionFolderId)
  })
  it(`should get user permissions for a data source`, async function () {
    return client.getDataSourceUserPermissions(config.dataSourceId)
  })
  it(`should get user permissions for a dashboard`, async function () {
    return client.getDashboardUserPermissions(config.dashboardId)
  })
  it(`should get user permissions for a dashboard folder`, async function () {
    return client.getDashboardFolderUserPermissions(config.dashboardFolderId)
  })
  it(`should get user permissions for a value list`, async function () {
    return client.getValueListUserPermissions(config.valueListId)
  })
  // this is disabld because I don't have any collections
  // it(`should get user permissions for a collection`, async function () {
  //   return client.getCollectionUserPermissions(config.collectionId)
  // })
  it(`should get user permissions for a system collection`, async function () {
    return client.getSystemCollectionUserPermissions(config.systemCollectionId)
  })

  it(`should set user permissions for a report`, async function () {
    return client.setReportUserPermissions(config.reportId, config.userId, 'execute')
  })
  it(`should set user permissions for a report folder`, async function () {
    return client.setReportFolderUserPermissions(config.reportFolderId, config.userId, 'execute')
  })
  it(`should set user permissions for a report definition`, async function () {
    return client.setReportDefinitionUserPermissions(config.reportDefinitionId, config.userId, 'execute')
  })
  it(`should set user permissions for a report definition folder`, async function () {
    return client.setReportDefinitionFolderUserPermissions(config.reportDefinitionFolderId, config.userId, 'execute')
  })
  it(`should set user permissions for a data source`, async function () {
    return client.setDataSourceUserPermissions(config.dataSourceId, config.userId, 'execute')
  })
  it(`should set user permissions for a dashboard`, async function () {
    return client.setDashboardUserPermissions(config.dashboardId, config.userId, 'execute')
  })
  it(`should set user permissions for a dashboard folder`, async function () {
    return client.setDashboardFolderUserPermissions(config.dashboardFolderId, config.userId, 'execute')
  })
  it(`should set user permissions for a value list`, async function () {
    return client.setValueListUserPermissions(config.valueListId, config.userId, 'execute')
  })
  // this is disabld because I don't have any collections
  // it(`should set user permissions for a collection`, async function () {
  //   return client.setCollectionUserPermissions(config.collectionId, config.userId, 'execute')
  // })
  it(`should set user permissions for a system collection`, async function () {
    return client.setSystemCollectionUserPermissions(config.systemCollectionId, config.userId, 'execute')
  })


  /* group permissions */
  it(`should get group permissions for a report`, async function () {
    return client.getReportGroupPermissions(config.reportId)
  })
  it(`should get group permissions for a report folder`, async function () {
    return client.getReportFolderGroupPermissions(config.reportFolderId)
  })
  it(`should get group permissions for a report definition`, async function () {
    return client.getReportDefinitionGroupPermissions(config.reportDefinitionId)
  })
  it(`should get group permissions for a report definition folder`, async function () {
    return client.getReportDefinitionFolderGroupPermissions(config.reportDefinitionFolderId)
  })
  it(`should get group permissions for a data source`, async function () {
    return client.getDataSourceGroupPermissions(config.dataSourceId)
  })
  it(`should get group permissions for a dashboard`, async function () {
    return client.getDashboardGroupPermissions(config.dashboardId)
  })
  it(`should get group permissions for a dashboard folder`, async function () {
    return client.getDashboardFolderGroupPermissions(config.dashboardFolderId)
  })
  it(`should get group permissions for a value list`, async function () {
    return client.getValueListGroupPermissions(config.valueListId)
  })
  // this is disabld because I don't have any collections
  // it(`should get group permissions for a collection`, async function () {
  //   return client.getCollectionGroupPermissions(config.collectionId)
  // })
  it(`should get group permissions for a system collection`, async function () {
    return client.getSystemCollectionGroupPermissions(config.systemCollectionId)
  })

  /***********
   * Setters *
   ***********/
  it(`should set group permissions for a report`, async function () {
    return client.setReportGroupPermissions(config.reportId, config.groupId, 'execute')
  })
  it(`should set group permissions for a report folder`, async function () {
    return client.setReportFolderGroupPermissions(config.reportFolderId, config.groupId, 'execute')
  })
  it(`should set group permissions for a report definition`, async function () {
    return client.setReportDefinitionGroupPermissions(config.reportDefinitionId, config.groupId, 'execute')
  })
  it(`should set group permissions for a report definition folder`, async function () {
    return client.setReportDefinitionFolderGroupPermissions(config.reportDefinitionFolderId, config.groupId, 'execute')
  })
  it(`should set group permissions for a data source`, async function () {
    return client.setDataSourceGroupPermissions(config.dataSourceId, config.groupId, 'execute')
  })
  it(`should set group permissions for a dashboard`, async function () {
    return client.setDashboardGroupPermissions(config.dashboardId, config.groupId, 'execute')
  })
  it(`should set group permissions for a dashboard folder`, async function () {
    return client.setDashboardFolderGroupPermissions(config.dashboardFolderId, config.groupId, 'execute')
  })
  it(`should set group permissions for a value list`, async function () {
    return client.setValueListGroupPermissions(config.valueListId, config.groupId, 'execute')
  })
  // this is disabld because I don't have any collections
  // it(`should set group permissions for a collection`, async function () {
  //   return client.setCollectionGroupPermissions(config.collectionId, config.groupId, 'execute')
  // })
  it(`should set group permissions for a system collection`, async function () {
    return client.setSystemCollectionGroupPermissions(config.systemCollectionId, config.groupId, 'execute')
  })


  /* set all object permissions operations */
  it(`should set user permissions for all reports`, async function () {
    return client.setAllReportUserPermissions(config.userId, 'execute')
  })
  it(`should set user permissions for all report definitions`, async function () {
    return client.setAllReportDefinitionUserPermissions(config.userId, 'execute')
  })
  it(`should set user permissions for all dashboards`, async function () {
    return client.setAllDashboardUserPermissions(config.userId, 'execute')
  })

  it(`should set group permissions for all reports`, async function () {
    return client.setAllReportGroupPermissions(config.groupId, 'execute')
  })
  it(`should set group permissions for all report definitions`, async function () {
    return client.setAllReportDefinitionGroupPermissions(config.groupId, 'execute')
  })
  it(`should set group permissions for all dashboards`, async function () {
    return client.setAllDashboardGroupPermissions(config.groupId, 'execute')
  })
})
