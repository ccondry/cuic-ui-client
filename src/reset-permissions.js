// this library
const CUIC = require('./index.js')
// load config from .env file
require('dotenv').config()

// create CUIC client to our CUIC
const client = new CUIC({
  host: process.env.HOST,
  username: process.env.USERNAME,
  domain: process.env.DOMAIN,
  password: process.env.PASSWORD,
  version: process.env.VERSION
})

// // turn tree into an array children with no containers
// function getAllChildren (tree, filter) {
//   const children = []
//   // for each child
//   for (const child of tree.children) {
//     // is filter enabled?
//     if (typeof filter === 'function') {
//       // skip this child if filter returns false
//       if (!filter(child)) {
//         continue
//       }
//     }
//     // add to return array
//     children.push(child)
//     // is this child another container?
//     if (child.container) {
//       // this is a container - recurse inside descendants
//       const grandchildren = children.getAllChildren (child, children, filter)
//       // add all descendents to children()
//       for (const grandchild of grandchildren) {
//         children.push(grandchild)
//       }
//     }
//   }
//   return []
// }

// turn tree into an array
function flatten (tree, filter) {
  const children = []
  // for each child
  for (const child of tree.children) {
    // filter out parts of the tree
    if (typeof filter === 'function') {
      if (!filter(child)) {
        continue
      }
    }
    // add current child to return array
    children.push(child)
    // is this child another container?
    if (child.container) {
      // recurse inside descendants
      const descendants = flatten(child, filter)
      // add all descendents to children()
      for (const descendant of descendants) {
        children.push(descendant)
      }
    }
  }
  return children
}

async function go () {
  // AllUsers group ID
  const allUsers = "2222222222222222222222222222AAAA"
  // set all users to view only on the reports
  const permissions = {
    groups: [{
      "id": allUsers,
      "permission": "EXECUTE"
    }]
  } 

  // get reports tree
  const reportsTree = await client.list('reports')
  // flatten reports and their folders to an array, and recursively filter out
  // the Intelligence Center Admin folder
  const reports = flatten(reportsTree, function (child) {
    // filter ICM admin report definitions
    return child.name !== 'Intelligence Center Admin'
  })

  try {
    for (const report of reports) {
      if (report.container) {
        // report folder
        await client.setPermissions('CATEGORY', report.id, permissions)
      } else {
        // report
        await client.setPermissions('REPORT', report.id, permissions)
      }
      console.log('successfully set permission for report', report.id)
    }
    console.log('finished setting permissions on', reports.length, 'reports.')
  } catch (e) {
    console.log('failed to set permissions on', reports.length, 'reports:', e.message)
  }

  // get dashboards tree
  const dashboardsTree = await client.list('dashboards')
  // flatten dashboards to an array
  const dashboards = flatten(dashboardsTree)
  try {
    for (const dashboard of dashboards) {
      if (dashboard.container) {
        // dashboard folder
        await client.setPermissions('CATEGORY', dashboard.id, permissions)
      } else {
        // dashboard
        await client.setPermissions('DASHBOARD', dashboard.id, permissions)
      }
      console.log('successfully set permission for dashboard', dashboard.id)
    }
    console.log('finished setting permissions on', dashboards.length, 'dashboards.')
  } catch (e) {
    console.log('failed to set permissions on', dashboards.length, 'dashboards:', e.message)
  }

  // get report definitions tree
  const reportDefinitionsTree = await client.list('reportdefinitions')
  const reportDefinitions = flatten(reportDefinitionsTree, function (child) {
    // filter ICM admin report definitions
    return child.name !== 'Intelligence Center Admin'
  })
  try {
    for (const reportDefinition of reportDefinitions) {
      if (reportDefinition.container) {
        // dashboard folder
        await client.setPermissions('CATEGORY', reportDefinition.id, permissions)
      } else {
        // dashboard
        await client.setPermissions('REPORTDEFINITION', reportDefinition.id, permissions)
      }
      console.log('successfully set permission for report definition', reportDefinition.id)
    }
    console.log('finished setting permissions on', reportDefinitions.length, 'report definitions.')
  } catch (e) {
    console.log('failed to set permissions on', reportDefinitions.length, 'report definitions:', e.message)
  }

  // Reports / Cumulus / AgentStateDistribution
  // const id = '275D24711000015F0000014339ED7AF1'
  
  // try {
  //   let p = await client.getPermissions('REPORT', id)
  //   console.log('got permissions for report', id)
  // } catch (e) {
  //   console.log('failed to get permissions for report', id, e.message)
  // }

  // try {
  //   await client.setPermissions('REPORT', id, permissions)
  //   console.log('successfully set permission for report', id)
  // } catch (e) {
  //   console.log('failed to set permissions on report', id, e.message)
  // }

}

go()
.catch(e => console.log(e))