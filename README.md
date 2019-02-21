# cuic-ui-client
This is a JavaScript library for interfacing with CUIC UI features that don't
have published REST APIs. It has been tested on standalone CUIC 11.6 connected to a
PCCE environment, but should work the same with any standalone CUIC 11.6.

## Features
Currently you can use this library to
* list users and groups with their internal IDs
* list reports, report definitions, dashboards, data sources, value lists, collections, system collections with their internal IDs and child/parent relationships
* update permissions for a user or group
* bulk update permissions on reports, report definitions, and dashboards
* initiate a sync of the CCE supervisors (for standalone CUIC integrated with UCCE/PCCE)

## Usage
```js
// this library
const CUIC = require('cuic-ui-client')
// create CUIC client
const client = new CUIC({
  host: 'cuic1.dcloud.cisco.com',
  username: 'administrator',
  domain: 'CUIC',
  password: 'C1sco12345'
})
// list reports with their folders
client.getReports()
.then(reports => console.log('reports found:', reports))
.catch(e => console.error('error:', e.message))
```

See test/test.js for more examples
