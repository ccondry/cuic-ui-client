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
      console.log('cuic-ui-client - syncCceSupervisors() - this.host =', this.host)
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
      return true
    } catch (e) {
      throw e
    }
  }

  // create login user for CUIC UI
  async createUser () {
    try {
      // try to log in as administrator and create ldap login user account

      // make a cookie jar for this session
      let cookieJar = request.jar()
      const options = {
        jar: cookieJar,
        // follow redirects to simplify request flows
        followAllRedirects: true
        // resolveWithFullResponse: true
      }

      // get initial cookie
      const response1 = await request(`https://${this.host}/`, options)
      // console.log('response1', response1)
      // console.log('cookie1:', cookieJar)
      // set username for login
      const response2 = await request.get(`https://${this.host}:8444/cuicui/j_identity_check?rawUserName=${this.username}&username=${this.username}&identitySubmitBtn=`, options)
      // console.log(response2)

      // add auth form
      options.form = {
        'j_username': this.username,
        'j_password': this.password,
        'j_domain': 'CUIC'
      }

      // do login
      const response3 = await request.post(`https://${this.host}:8444/cuicui/j_security_check`, options)
      // console.log(response3)

      // remove login form data from request options
      delete options.form

      // working
      // const response4 = await request.get(`https://${this.host}:8444/cuicui/Main.jsp`, options)
      // console.log('cookie3:', cookieJar)
      // console.log('response4', response4)

      options.headers = {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityEditorAddEditUserList.htmx?title=User%20List&action=Create&showActiveUsersOnly=no&cmd=ADD`,
        // Referer: `https://${this.host}:8444/cuic/Main.htmx?open=security`
        'Content-Type': 'application/x-www-form-urlencoded'
      }

      const newUser = {
        userName:'DCLOUD.CISCO.COM\\dawake',
        alias:'',
        userActive:true,
        firstName:'Darren',
        lastName:'Wake',
        company:'Cisco Systems ',
        email:'dawake @cisco.com ',
        phone:'',
        description:'',
        partition:'Default',
        timeZone:'America / Chicago',
        startDayOfWeek:0,
        defaultUserGroup:'AllUsers',
        loginUser:true,
        sysConfigAdmin:false,
        securityAdmin:false,
        dashboardDesigner:true,
        reportDesigner:true,
        reportDefinitionDesigner:true,
        valueListCollectionDesigner:true,
        groupWrite:false,
        groupExecute:false,
        globalWrite:false,
        globalExecute:false,
        removedParentGroups:[],
        addedParentGroups:['AllUsers']
      }

      options.form = {
        cmd: 'CREATE',
        isAjaxCall: 'true',
        userInfo: JSON.stringify(newUser)
      }

      const response5 = await request.post('https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityEditorAddEditUserList.htmx', options)
      // load Main.htmx?
      // const response5 = await request.get(`https://${this.host}:8444/cuic/Main.htmx?updateDrawer=securityDrawer`, options)
      // const rsp = await request.get(`https://cuic1.dcloud.cisco.com:8444/cuic/Main.htmx`, options)
      // console.log('rsp:', rsp)

      // testing
      // add referer header so the requests won't fail
      // options.headers = {
      //   Referer: `https://${this.host}:8444/cuic/Main.htmx`
      // }
      // const response6 = await request.get(`https://${this.host}:8444/cuic/security/SecurityEditorUserList.htmx`, options)

      // const response4 = await request.get(`https://${this.host}:8444/cuic/Main.htmx?open=security`, options)
      // const response4 = await request.get(`https://${this.host}:8444/cuic/security/SecurityViewer.htmx`, options)
      // const response4 = await request.get(`https://${this.host}:8444/cuic/security/SecurityEditorAddEditUserList.htmx?title=User%20List&action=Create&showActiveUsersOnly=no&cmd=ADD`, options)
      return response5
      // private static final String SECURITY_VIEWER_HTMX = "security/SecurityViewer.htmx";
    	// private static final String USER_LIST_HTMX = "security/SecurityEditorUserList.htmx";
    	// private static final String EDIT_USER_LIST = "security/SecurityEditorAddEditUserList.htmx";

      // let path = "security/SecurityEditorAddEditUserList.htmx"

		// Form form = new Form()
		// 		.param("cmd", "CREATE")
		// 		.param("userInfo", userInfo.toString())
		// 		.param("isAjaxCall", "true");
		// WebTarget target = getWebTarget(path);
		// replace URL parameters with values
		// String referer = adminPageUrl + "security/SecurityEditorAddEditUserList.htmx?title=User%20List&action=Create%20&showActiveUsersOnly=no&cmd=ADD";
		// return cuicAjaxPost(form, target, referer, _authenticatedCookie, _csrfToken);

      // get CSRF token
      // const arr = response1.match(/<input type="hidden" id="csrfToken" name="csrfToken" value="([A-F,0-9]+)">/m)
      // const csrfToken = arr[1]
      // options.form = {
      //   scheduledTime: '13%3A00',
      //   method: 'toggleSynchronization',
      //   enabled: 'on',
      //   cbMonday: 'on',
      //   cbTuesday: 'on',
      //   cbWednesday: 'on',
      //   cbThursday: 'on',
      //   cbFriday: 'on',
      //   cbSaturday: 'on',
      //   cbSunday: 'on',
      //   csrfToken
      // }

      // post change
      // const response2 = await request.post(`https://${this.host}:8444/cuicui/configCUICUserIntegration.do`, options)

    } catch (e) {
      throw e
    }
  }
}

module.exports = CUIC
