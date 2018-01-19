const client = require('./index.js')

let cuic = new client({
  host: 'cuic1.dcloud.cisco.com',
  username: 'administrator',
  password: 'C1sco12345'
})

cuic.syncCceSupervisors()
.then(results => {
  console.log('done')
}).catch(error => {
  console.error(error)
})
