const request = require('request-promise-native')
const queryString = require('query-string')

// construct cookie string for REST requests
function makeCookieString ({jSessionId, jSessionIdSso, xsrf}) {
  let cookieString = `JSESSIONID=${jSessionId};`
  cookieString += `JSESSIONIDSSO=${jSessionIdSso};`
  cookieString += `XSRF-TOKEN=${xsrf};`
  return cookieString
}

// just a sleep function
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// our class
class CUIC {
  // host, username, password are required parameters
  constructor ({host, username, password, domain = 'CUIC', timeout = 3600, throttle = 100}) {
    if (!host) throw Error('CUIC client - host is a required parameter')
    if (!username) throw Error('CUIC client - username is a required parameter')
    if (!password) throw Error('CUIC client - password is a required parameter')

    this.host = host
    this.username = username
    this.password = password
    this.domain = domain
    this.baseUrlCuic = 'https://' + this.host + ':8444'
    this.baseUrlOamp = 'https://' + this.host
    // store cookie timeout as milliseconds
    this.timeout = timeout * 1000
    // throttle for setAllPermissions functions, in milliseconds
    this.throttle = throttle
    // last cookie timestamp
    this.lastAuthenticated = 0
  }

  /* user-friendly methods */

  // get list of users from security page
  async getUsersAndGroups () {
    try {
      // get valid cookie first
      await this.checkCookie()
      // get HTML data
      const html = await request({
        baseUrl: this.baseUrlCuic,
        url: '/cuic/security/SecurityPermissions.htmx',
        method: 'GET',
        headers: {
          Origin: this.baseUrlCuic,
          Cookie: this.cookieString
        }
      })

      // get the section of HTML we need to work with
      const string1 = 'var userGroupInfoJSONStr'
      const start = html.indexOf(string1) + string1.length
      const end = html.indexOf('var allUsers', start)
      const part = html.substring(start, end)

      // extract the JSON data for users and groups
      const users = this.extractData(part, `potentialUserMembersJSONStr = '`, `';`)
      const groups = this.extractData(part, `potentialGroupMembersJSONStr = '`, `';`)
      // return both
      return {users, groups}
    } catch (e) {
      throw e
    }
  }

  // extract JSON string from HTML and parse it as JSON
  extractData (html, string1, string2) {
    const start = html.indexOf(string1) + string1.length
    const end = html.indexOf(string2, start)
    // did we find something?
    if (start > 0 && end > 0) {
      // extract the JSON data
      const data = html.substring(start, end)
      // return a JSON array
      return JSON.parse(data)
    } else {
      // throw an error that is hopefully meaningful
      throw Error('CUIC client - invalid data in getUsers response. Response length was ' + html.length)
    }
  }

  /* get list of items from security permission manager page */
  getReports () {
    return this.getEntities(CUIC.OBJECT_TYPE_REPORT_FOLDER)
  }
  getReportDefinitions () {
    return this.getEntities(CUIC.OBJECT_TYPE_REPORT_DEFINITION_FOLDER)
  }
  getDataSources () {
    return this.getEntities(CUIC.OBJECT_TYPE_DATA_SOURCE)
  }
  getDashboards () {
    return this.getEntities(CUIC.OBJECT_TYPE_REPORT_DASHBOARD_FOLDER)
  }
  getValueLists () {
    return this.getEntities(CUIC.OBJECT_TYPE_VALUE_LIST)
  }
  getCollections () {
    return this.getEntities(CUIC.OBJECT_TYPE_COLLECTION)
  }
  getSystemCollections () {
    return this.getEntities(CUIC.OBJECT_TYPE_SYSTEM_COLLECTION)
  }

  /* set permissions for one item for a single user or list of users */
  setUserReportPermission (id, userIds, permission) {
    return this.setPermissionUser(CUIC.OBJECT_TYPE_REPORT_FOLDER)
    return this.setPermissionUser({
      id: userIds,
      entityType: e,
      objId: item.id,
      type: permission
    })
  }
  // getReportDefinitions () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_REPORT_DEFINITION_FOLDER)
  // }
  // getDataSources () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_DATA_SOURCE)
  // }
  // getDashboards () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_REPORT_DASHBOARD_FOLDER)
  // }
  // getValueLists () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_VALUE_LIST)
  // }
  // getCollections () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_COLLECTION)
  // }
  // getSystemCollections () {
  //   return this.getEntities(CUIC.OBJECT_TYPE_SYSTEM_COLLECTION)
  // }

  // extract a key value from a request.js cookie jar
  getCookieValue (jar, path, key) {
    const cookie = jar._jar.store.idx[this.host]
    return cookie[path][key].value
  }

  // get cookie info for REST requests
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

  // check if cookie is expired, and if it is get a new one
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

  // make a request to the security permissions URL
  // this can be a get or set operation
  async doSecurityPermissions (body) {
    try {
      return await request({
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
    } catch (e) {
      if (e.statusCode === 302) {
        // redirect means not logged in
        throw Error('not logged in')
        // try to log in so the next request works
        this.authenticate().catch(e => {
          console.error('CUIC client - failed to log in again', e.message)
        })
      } else {
        throw e
      }
    }
  }

  // get list of entities, like dashboards or reports
  async getEntities (entityType) {
    let response
    try {
      // is our cookie expired?
      await this.checkCookie()

      const body = queryString.stringify({
        cmd: 'LOAD_OBJECTS',
        entityType,
        isSysCollections: 'false',
        isAjaxCall: 'true'
      })

      response = await this.doSecurityPermissions(body)

    } catch (e) {
      throw e
    }

    // extract and parse results
    const r = JSON.parse(response)
    if (r.entityData) {
      // is result an array?
      if (Array.isArray(r.entityData)) {
        // return the array
        return r.entityData
      }
      // otherwise, try to parse out the entity data as a JSON object, and
      // return the items array in it
      try {
        return JSON.parse(r.entityData).items
      } catch (e) {
        return r
      }
    } else {
      return r
    }
  }

  // set permissions for all reports and report folders for a user group ID
  async setAllReportPermissionsGroup (permission, groupId) {
    this.setAllPermissionsGroup (permission, CUIC.OBJECT_TYPE_REPORT_FOLDER, CUIC.OBJECT_TYPE_REPORT, groupId)
  }

  // set permissions for all reports and report folders for a single user ID or an array of user IDs
  async setAllReportPermissionsUsers (permission, userId) {
    // make sure we have an array of user IDs, even if a single string ID was passed
    const userIds = Arrays.isArray(userId) ? userId : [userId]
    this.setAllPermissionsUsers (permission, CUIC.OBJECT_TYPE_REPORT_FOLDER, CUIC.OBJECT_TYPE_REPORT, userIds)
  }

  // set permissions for all entities of a single type (and their containers) for list of user IDs
  async setAllPermissionsUsers (permission, entityContainerType, entityType, userIds) {
    try {
      // get list of object
      const list = await this.getEntities(entityType)
      // iterate over objects
      for (const item of list) {
        // determine entity type
        let e
        // is this a folder?
        if (item.container === 'yes') {
          // folder
          e = entityContainerType
        } else {
          // non-folder item
          e = entityType
        }

        // set permission for one object
        this.setPermissionUser({
          id: userIds,
          entityType: e,
          objId: item.id,
          type: permission
        })
        .then(r => {
          console.log('successfully saved permission', permission, 'on type', entityType, item.id, 'for users', userIds)
        })
        .catch(e => {
          console.error('failed to save permission', permission, 'on type', entityType, item.id, 'for users', userIds, ':', e.message)
        })

        // throttle requests
        await sleep(throttle)
      }
    } catch (e) {
      throw e
    }
  }

  // set permissions for all entities of a single type for a specified user group
  async setAllPermissionsGroup (permission, entityContainerType, entityType, group) {
    try {
      const list = await this.getEntities(entityType)
      // console.log('found entities', list)
      for (const item of list) {
        // is this a folder?
        let e
        if (item.container === 'yes') {
          // folder
          e = entityContainerType
        } else {
          // non-folder item
          e = entityType
        }

        // set permission for one object
        this.setPermissionGroup ({
          id: group,
          entityType: e,
          objId: item.id,
          type: permission
        })
        .then(r => console.log('successfully saved permission', permission, 'on type', entityType, item.id, 'for group', group))
        .catch(e => console.error('failed to save permission', permission, 'on type', entityType, item.id, 'for group', group, ':', e.message))
        // throttle requests
        await sleep(throttle)
      }
    } catch (e) {
      throw e
    }
  }

  // set permissions on an object for a list of user IDs
  async setPermissionUser ({id, entityType, objId, type}) {
    // permissions: {
    // user ID
    //   "id": ["D52FC6ED10000168000006B739ED7AF1"],
    // object type
    //   "entityType":"2",
    // entity/object ID
    //   "objId":"AD21C8F4100001590000001039ED7AF1",
    // permission value
    //   "type":7
    // }
    try {
      await this.checkCookie()
      let body = 'cmd=SAVE_USER_PERMISSIONS'
      body += '&permissions=' + encodeURIComponent(JSON.stringify(permissions))
      body += '&isAjaxCall=true'

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

  async setPermissionGroup (permissions) {
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
      body += '&permissions=' + encodeURIComponent(JSON.stringify(permissions))
      body += '&isAjaxCall=true'

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
      await this.checkCookie()

      const p = {
        isUser,
        objId,
        entityType
      }

      let body = 'cmd=GET_USER_OR_GROUP_PERMISSIONS'
      body += '&permissions=' + encodeURIComponent(JSON.stringify(p))
      body += '&isAjaxCall=true'

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
      await this.checkCookie()

      const newUser = {
        userName:'DCLOUD\\test14',
        alias:'',
        userActive:true,
        firstName:'test14',
        lastName:'test14',
        company:'Cisco Systems',
        email:'test14@cisco.com',
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

      const response = await request({
        baseUrl: this.baseUrlCuic,
        url: '/cuic/security/SecurityEditorAddEditUserList.htmx',
        method: 'POST',
        form: {
          cmd: 'CREATE',
          isAjaxCall: 'true',
          userInfo: JSON.stringify(newUser)
        },
        headers: {
          Origin: this.baseUrlCuic,
          Cookie: this.cookieString
        }
      })

      return response
    } catch (e) {
      throw e
    }
  }
}

// set static properties
CUIC.GROUP_ALL_USERS = '2222222222222222222222222222AAAA'
CUIC.GROUP_ADMINISTRATORS = '2222222222222222222222222222BBBB'

CUIC.OBJECT_TYPE_REPORT = 1
CUIC.OBJECT_TYPE_REPORT_FOLDER = 2

CUIC.OBJECT_TYPE_REPORT_DEFINITION = 3
CUIC.OBJECT_TYPE_REPORT_DEFINITION_FOLDER = 4

CUIC.OBJECT_TYPE_REPORT_DASHBOARD = 5
CUIC.OBJECT_TYPE_REPORT_DASHBOARD_FOLDER = 6

CUIC.OBJECT_TYPE_DATA_SOURCE = 7

CUIC.OBJECT_TYPE_VALUE_LIST = 8

CUIC.OBJECT_TYPE_COLLECTION = 9

CUIC.OBJECT_TYPE_SYSTEM_COLLECTION = 10

CUIC.PERMISSION_NONE = 0
CUIC.PERMISSION_EXECUTE = 3
CUIC.PERMISSION_ALL = 7

module.exports = CUIC
