const request = require('request-promise-native')
const queryString = require('query-string')

function makeCookieString ({jSessionId, jSessionIdSso, xsrf}) {
  let cookieString = `JSESSIONID=${jSessionId};`
  cookieString += `JSESSIONIDSSO=${jSessionIdSso};`
  cookieString += `XSRF-TOKEN=${xsrf};`
  return cookieString
}

class CUIC {

  constructor ({host, username, password, domain = 'CUIC', timeout = 3600}) {
    this.host = host
    this.username = username
    this.password = password
    this.domain = domain
    this.baseUrlCuic = 'https://' + this.host + ':8444'
    this.baseUrlOamp = 'https://' + this.host
    // store timeout as milliseconds
    this.timeout = timeout * 1000
    this.lastAuthenticated = 0
  }

  getCookieValue (jar, path, key) {
    const cookie = jar._jar.store.idx[this.host]
    return cookie[path][key].value
  }

  // get cookie for REST requests
  async authenticate () {
    const jar = request.jar()
    await request({
      baseUrl: this.baseUrlCuic,
      url: '/cuic/rest/crossdomain',
      method: 'GET',
      jar,
      auth: {
        user: this.domain + '\\' + this.username,
        pass: this.password
      }
    })
    // extract cookie values that we need
    let jSessionId = this.getCookieValue(jar, '/cuic', 'JSESSIONID')
    let jSessionIdSso = this.getCookieValue(jar, '/', 'JSESSIONIDSSO')
    let xsrf = this.getCookieValue(jar, '/', 'XSRF-TOKEN')

    // set cookie string
    this.cookieString = makeCookieString({
      jSessionId,
      jSessionIdSso,
      xsrf
    })

    // set authenticated timestamp
    this.lastAuthenticated = Date.now()
  }

  async checkCookie () {
    if (Date.now() - this.timeout > this.lastAuthenticated) {
      // console.log('need to authenticate...')
      // authenticate again to get new cookie
      await this.authenticate()
      // console.log('authenticated!')
    } else {
      // console.log('already authenticated')
    }
  }

  // get list of entities, like dashboards or reports
  async getEntities (entityType) {
    let response
    try {
      // is our cookie expired?
      // console.log('Date.now', Date.now())
      await this.checkCookie()

      response = await request({
        baseUrl: this.baseUrlCuic,
        url: '/cuic/security/SecurityPermissions.htmx',
        method: 'POST',
        body: queryString.stringify({
          cmd: 'LOAD_OBJECTS',
          entityType,
          isSysCollections: 'false',
          isAjaxCall: 'true'
        }),
        headers: {
          Origin: this.baseUrlCuic,
          'Content-Type': 'application/x-www-form-urlencoded',
          // 'X-Requested-With': 'XMLHttpRequest',
          Cookie: this.cookieString
        }
      })

    } catch (e) {
      if (e.statusCode === 302) {
        // redirect means not logged in
        throw Error('not logged in')
      } else {
        throw e
      }
    }

    // extract and parse results
    const r = JSON.parse(response)
    if (r.entityData) {
      try {
        return JSON.parse(r.entityData).items
      } catch (e) {
        return r
      }
    } else {
      return r
    }
  }

  async setAllPermissions (permission, entityType, userOrGroup) {
    try {
      const list = await this.getEntities(entityType)
      // console.log('found entities', list)
      for (const item of list) {
        // is this a folder?
        let e
        if (item.container === 'yes') {
          // folder
          e = entityType
        } else {
          // non-folder item
          e = entityType - 1
        }
        try {
          await this.savePermission ({
            id: userOrGroup,
            entityType: e,
            objId: item.id,
            type: permission
          })
          console.log('successfully saved permission', permission, 'on type', entityType, item.id, 'for group', userOrGroup)
          // .then(r => console.log('successfully saved permission', permission, 'on type', entityType, item.id, 'for group', userOrGroup))
          // .catch(e => console.error('failed to save permission', permission, 'on type', entityType, item.id, 'for group', userOrGroup, ':', e.message))
        } catch (e) {
          console.error('failed to save permission', permission, 'on type', entityType, item.id, 'for group', userOrGroup, ':', e.message)
        }
      }
    } catch (e) {
      throw e
    }
  }

  async savePermission (permissions) {
    // {
    //   // user or group ID. this one is AllUsers
    //   "id":"2222222222222222222222222222AAAA",
    //   // report/dashboard/etc. object type ID - 2 for reports
    //   "entityType":"2",
    //   // report/dashboard/etc. object ID
    //   "objId":"AD21C8F4100001590000001039ED7AF1",
    //   // the permission - 0 for none, 3 for execute, 7 for write and execute
    //   "type":3
    // }
    try {
      await this.checkCookie()
      let body = 'cmd=SAVE_GROUP_PERMISSIONS'
      // body += '&permissions=%7B%22isUser%22%3Afalse%2C%22objId%22%3A%22F8026749681C44BE8D07C0244221AC4E%22%2C%22entityType%22%3A5%7D'
      body += '&permissions=' + encodeURIComponent(JSON.stringify(permissions))
      body += '&isAjaxCall=true'

      // console.log('body', body)
      const response = await request({
        baseUrl: this.baseUrlCuic,
        url: '/cuic/security/SecurityPermissions.htmx',
        method: 'POST',
        body,
        headers: {
          Origin: this.baseUrlCuic,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.cookieString
        }
      })
      const json = JSON.parse(response)
      if (json.returnCode === '0') {
        // success
        return
      } else {
        // failed
        throw Error(json.returnMsg)
      }
    } catch (e) {
      throw e
    }
  }

  // get permissions on an object
  async getPermissions (entityType, objId, isUser = false) {
    try {
      // is our cookie expired?
      // console.log('Date.now', Date.now())
      if (Date.now() - this.timeout > this.lastAuthenticated) {
        console.log('need to authenticate...')
        // authenticate again to get new cookie
        await this.authenticate()
        console.log('authenticated!')
      } else {
        console.log('already authenticated')
      }
      // const body = queryString.stringify({
      //   cmd: 'GET_USER_OR_GROUP_PERMISSIONS',
      //   permissions: '%257B%2522isUser%2522%253Afalse%252C%2522objId%2522%253A%2522F8026749681C44BE8D07C0244221AC4E%2522%252C%2522entityType%2522%253A5%257D',
      //   isAjaxCall: 'true'
      // })

      const p = {
        isUser,
        objId,
        entityType
      }

      let body = 'cmd=GET_USER_OR_GROUP_PERMISSIONS'
      // body += '&permissions=%7B%22isUser%22%3Afalse%2C%22objId%22%3A%22F8026749681C44BE8D07C0244221AC4E%22%2C%22entityType%22%3A5%7D'
      body += '&permissions=' + encodeURIComponent(JSON.stringify(p))
      body += '&isAjaxCall=true'
      // console.log('body', body)
      const response = await request({
        baseUrl: this.baseUrlCuic,
        url: '/cuic/security/SecurityPermissions.htmx',
        method: 'POST',
        body,
        headers: {
          Origin: this.baseUrlCuic,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.cookieString
        }
      })
      // extract and parse results
      // return JSON.parse(JSON.parse(response).entityData).items
      return response
    } catch (e) {
      if (e.statusCode === 302) {
        // redirect means not logged in
        throw Error('not logged in')
      } else {
        throw e
      }
    }
  }

  async getCookie () {
    try {
      let cookieJar = request.jar()
      // get initial cookie
      const response1 = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Login.jsp',
        jar: cookieJar,
        followAllRedirects: true
      })
      // let jsessionId1 = getCookieValue(cookieJar, '/cuicui', 'JSESSIONID')
      // console.log('cookieJar', cookieJar._jar.store.idx['cuic1.dcloud.cisco.com'])
      // console.log('jsessionId1', jsessionId1)
      const response2 = await request({
        url: `https://${this.host}:8444/cuicui/Main.jsp`,
        jar: cookieJar,
        followAllRedirects: true
      })
      // console.log('cookieJar', cookieJar._jar.store.idx['cuic1.dcloud.cisco.com'])
      const response3 = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuicui/j_identity_check',
        jar: cookieJar,
        followAllRedirects: true,
        qs: {
          rawUserName:'administrator',
          username:'administrator',
          identitySubmitBtn:''
        }
      })
      // console.log('cookieJar', cookieJar._jar.store.idx['cuic1.dcloud.cisco.com'])
      // now we should have xsrf inside response3 body
      // return response3

      const search1 = '<input type="hidden" id="X-XSRF-TOKEN" name="X-XSRF-TOKEN"'
      const search2 = 'value='
      // find the beginning index of the xsrf tag
      const i1 = response3.indexOf(search1)
      // console.log('i1', i1)
      // find the index of the beginning of the xsrf tag value property
      const i2 = response3.indexOf(search2, i1 + search1.length)
      // console.log('i2', i2)
      // calculate beginning index of the xsrf token
      const begin = i2 + search2.length + 1
      // console.log('begin', begin)
      // find end index of the xsrf token
      const end = response3.indexOf('"', begin)
      // console.log('end', end)
      // extract the xsrf token
      let xsrf = response3.substring(begin, end)
      console.log('xsrf', xsrf)
      // return xsrf

      const body = queryString.stringify({
        'X-XSRF-TOKEN': xsrf,
        j_username: 'administrator',
        j_password: 'SushiKing123!',
        j_domain: 'CUIC'
      })
      const response4 = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuicui/j_security_check',
        method: 'POST',
        jar: cookieJar,
        followAllRedirects: true,
        body,
        headers: {
          Origin: 'https://cuic1.dcloud.cisco.com:8444',
          Referer: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Login.jsp',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      // console.log('cookieJar', cookieJar._jar.store.idx['cuic1.dcloud.cisco.com'])
      const response5 = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Main.jsp',
        method: 'GET',
        jar: cookieJar,
        followAllRedirects: true,
        qs: {
          open: 'security'
        },
        headers: {
          Origin: 'https://cuic1.dcloud.cisco.com:8444',
          Referer: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Login.jsp'
        }
      })
      // console.log('cookieJar', cookieJar._jar.store.idx['cuic1.dcloud.cisco.com'])
      // const response6 = await request({
      //   url: 'https://cuic1.dcloud.cisco.com:8444/cuic/Main.htmx',
      //   method: 'GET',
      //   jar: cookieJar,
      //   followAllRedirects: true,
      //   qs: {
      //     open: 'security'
      //   },
      //   headers: {
      //     Origin: 'https://cuic1.dcloud.cisco.com:8444',
      //     Referer: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Main.jsp'
      //   }
      // })
      // console.log('cookieJar', cookieJar.getCookies('cuic1.dcloud.cisco.com'))
      // const cookie = cookieJar._jar.store.idx['cuic1.dcloud.cisco.com']

      let jsessionId = getCookieValue(cookieJar, '/cuicui', 'JSESSIONID')
      let jsessionIdSso = getCookieValue(cookieJar, '/', 'JSESSIONIDSSO')
      console.log('jsessionId', jsessionId)
      console.log('jsessionIdSso', jsessionIdSso)
      // get new xsrf token
      const response6 = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuic/rest/crossdomain',
        method: 'GET',
        jar: cookieJar,
        headers: {
          Origin: 'https://cuic1.dcloud.cisco.com:8444',
          Referer: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Login.jsp'
        },
        resolveWithFullResponse: true
      })
      console.log('response6', response6.headers)
      // console.log('cookieJar', cookieJar)
      // let xsrf2 =

      // jsessionId = '5A792749EF28C1D34748DBC31A4ABF0A'
      // jsessionIdSso = '860E332B79BD7771B37E3D18BA8E7C56'
      // xsrf ='0d38b7b3-23fc-4598-8781-425b07809095'
      // return response4
      // {
      //   _jar:
      //   CookieJar {
      //     enableLooseMode: true,
      //     store:
      //     {
      //       idx: {
      //         'cuic1.dcloud.cisco.com': {
      //           '/cuicui': {
      //             JSESSIONID: Cookie="JSESSIONID=369FF515E20A94800CD8A24D2D4AFDA6; Path=/cuicui; Secure; HttpOnly; hostOnly=true; aAge=175ms; cAge=1316ms"
      //           },
      //           '/': {
      //             cc_domain: Cookie="cc_domain=.dcloud.cisco.com; Path=/; Secure; hostOnly=true; aAge=176ms; cAge=1141ms",
      //             JSESSIONIDSSO: Cookie="JSESSIONIDSSO=7724A8CD164FD53C94BFE5AD08809922; Path=/; Secure; HttpOnly; hostOnly=true; aAge=177ms; cAge=178ms" }
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
      //
      // let cookieString = `JSESSIONID=${jsessionId};`
      // cookieString += `cc_domain=.dcloud.cisco.com;`
      // cookieString += `JSESSIONIDSSO=${jsessionIdSso};`
      // cookieString += `XSRF-TOKEN=${xsrf2};`
      // cookieString += `JSESSIONID=${jsessionId1};`
      //
      // console.log('cookieString', cookieString)
      // const response7 = await request({
      //   url: 'https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityPermissions.htmx',
      //   method: 'POST',
      //   jar: cookieJar,
      //   followAllRedirects: true,
      //   body: queryString.stringify({
      //     cmd: 'LOAD_OBJECTS',
      //     entityType: '2',
      //     isSysCollections: 'false',
      //     isAjaxCall: 'true'
      //   }),
      //   headers: {
      //     Origin: 'https://cuic1.dcloud.cisco.com:8444',
      //     Referer: 'https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityPermissions.htmx',
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //     'X-Requested-With': 'XMLHttpRequest',
      //     // Cookie: cookieString
      //   }
      // })
      // return response7


      // base 64 auth for xhr - CUIC\administrator:SushiKing123!

      // const response5 = await request({
      //   url: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Landing.jsp',
      //   method: 'GET',
      //   jar: cookieJar,
      //   followAllRedirects: true
      // })
      // return cookieJar
    } catch (e) {
      throw e
    }
  }

  async continue (cookieJar) {
    try {
      const response = await request({
        url: 'https://cuic1.dcloud.cisco.com:8444/cuic/Main.htmx',
        method: 'GET',
        jar: cookieJar,
        qs: {open: 'security'},
        headers: {
          Origin: 'https://cuic1.dcloud.cisco.com:8444',
          Referer: 'https://cuic1.dcloud.cisco.com:8444/cuicui/Main.jsp'
        }
      })
      console.log(response)
      return cookieJar
    } catch (e) {
      throw e
    }
  }

  async listReportPermissions (cookieJar) {
    return request({
      url: 'https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityPermissions.htmx',
      method: 'POST',
      jar: cookieJar,
      body: queryString.stringify({
        cmd: 'LOAD_OBJECTS',
        entityType: '2',
        isSysCollections: 'false',
        isAjaxCall: 'true'
      }),
      headers: {
        Origin: 'https://cuic1.dcloud.cisco.com:8444',
        Referer: 'https://cuic1.dcloud.cisco.com:8444/cuic/security/SecurityPermissions.htmx',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
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
        userName:'DCLOUD\\test14',
        alias:'',
        userActive:true,
        firstName:'test14',
        lastName:'test14',
        company:'Cisco Systems ',
        email:'test14@cisco.com ',
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

// set static properties
CUIC.GROUP_ALL_USERS = '2222222222222222222222222222AAAA'
CUIC.GROUP_ADMINISTRATORS = '2222222222222222222222222222BBBB'
CUIC.OBJECT_TYPE_REPORT_FOLDERS = 2
CUIC.OBJECT_TYPE_REPORT = 1
CUIC.OBJECT_TYPE_REPORTS = 2
CUIC.OBJECT_TYPE_REPORT_DEFINITIONS = 4
CUIC.OBJECT_TYPE_DASHBOARDS = 6
CUIC.OBJECT_TYPE_DATA_SOURCES = 7
CUIC.OBJECT_TYPE_VALUE_LISTS = 8
CUIC.OBJECT_TYPE_COLLECTIONS = 9
CUIC.PERMISSION_NONE = 0
CUIC.PERMISSION_EXECUTE = 3
CUIC.PERMISSION_ALL = 7

module.exports = CUIC
