require('dotenv').load()
const client = require('./index.js')

let cuic = new client({
  host: process.env.HOST,
  username: process.env.USERNAME,
  domain: process.env.DOMAIN,
  password: process.env.PASSWORD
})

// cuic.syncCceSupervisors()
// .then(results => {
//   console.log('done')
//   // make sure the cookie jar isn't breaking a second attempt
//   cuic.syncCceSupervisors()
//   .then(results => {
//     console.log('done')
//   }).catch(error => {
//     console.error(error)
//   })
// }).catch(error => {
//   console.error(error)
// })
// cuic.createUser2()
// .then(results => {
//   console.log(results)
// }).catch(error => {
//   console.error(error)
// })

// cuic.setAllPermissions(client.PERMISSION_EXECUTE, client.OBJECT_TYPE_DASHBOARDS, client.GROUP_ALL_USERS)
// cuic.setAllPermissions(client.PERMISSION_EXECUTE, client.OBJECT_TYPE_REPORTS, client.GROUP_ALL_USERS)
// cuic.savePermission({
//   // user or group ID. this one is AllUsers
//   "id": "2222222222222222222222222222AAAA",
//   // report/dashboard/etc. object type ID - 2 for reports
//   "entityType": 1,
//   // report/dashboard/etc. object ID
//   "objId": "CCCCCCCC00000000CCCCCCCC00000001",
//   // the permission - 0 for none, 3 for execute, 7 for write and execute
//   "type": 3
// })
// cuic.getEntities(client.OBJECT_TYPE_REPORTS)
cuic.setAllPermissions(client.PERMISSION_EXECUTE, client.OBJECT_TYPE_DASHBOARDS, client.GROUP_ALL_USERS)
.then(r => {
  cuic.setAllPermissions(client.PERMISSION_EXECUTE, client.OBJECT_TYPE_REPORTS, client.GROUP_ALL_USERS)
})
.then(r => {
  cuic.setAllPermissions(client.PERMISSION_EXECUTE, client.OBJECT_TYPE_REPORT_DEFINITIONS, client.GROUP_ALL_USERS)
})
// .then(cookieString => {
// console.log(cookieString)
// return cuic.getReportDefinitionPermissions(cookieString)
// return cuic.getDashboardPermissions(cookieString)
// })
// .then(permissions => {

// console.log(JSON.stringify(permissions, null, 2))
// return cuic.getReportPermissions(cookieString)
// })
.catch(error => {
  console.error(error)
})
