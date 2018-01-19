const request = require('request-promise-native')

class CUIC {

  constructor({host, username, password}) {
    this.host = host
    this.username = username
    this.password = password
  }

  // initiate a sync of the CCE supervisor agent accounts into CUIC
  async syncCceSupervisors () {
    try {
      let cookieJar = request.jar()
      const options = {
        jar: cookieJar,
        followAllRedirects: true
      }
      // get initial cookie
      await request(`https://${this.host}/oamp/Login.do`, options)
      // add auth
      options.form = {
        'j_username': this.username,
        'j_password': this.password
      }
      // post auth
      const response1 = await request.post(`https://${this.host}/oamp/j_security_check`, options)
      // get CSRF token
      const arr = response1.match(/<input type="hidden" id="csrfToken" name="csrfToken" value="([A-F,0-9]+)">/m)
      const csrfToken = arr[1]
      options.form = {
        scheduledTime: '13%3A00',
        method: 'toggleSynchronization',
        enabled: 'on',
        cbMonday: 'on',
        cbTuesday: 'on',
        cbWednesday: 'on',
        cbThursday: 'on',
        cbFriday: 'on',
        cbSaturday: 'on',
        cbSunday: 'on',
        csrfToken
      }

      // post change
      const response2 = await request.post(`https://${this.host}/oamp/configCUICUserIntegration.do`, options)
      return
    } catch (e) {
      throw e
    }
  }
}

module.exports = CUIC
