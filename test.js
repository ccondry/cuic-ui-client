const client = require('./index.js')

let cuic = new client({
  host: 'cuic1.dcloud.cisco.com',
  username: 'administrator',
  password: 'C1sco12345'
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
cuic.createUser()
.then(results => {
  console.log(results)
}).catch(error => {
  console.error(error)
})
