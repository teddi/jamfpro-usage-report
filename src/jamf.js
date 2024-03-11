// Determining if a property is defined
function isDefined(property) {
  return (typeof property !== 'undefined');
}

// Exit with alert if property is not defined
function alertNotSetProperty() {
  throw new Error('Property is not set');
}

class Request {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  request(method, url, headers = this.headers(), payload = null) {
    let res = {};
    try {
      const options = {
        method,
        headers
      };
      if (method === 'post' && Object.keys(payload).length > 0) {
        options.payload = payload;
      }

      const response = UrlFetchApp.fetch(url, options);
      res = JSON.parse(response.getContentText());
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
    return res;
  }

  // Common Headers
  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json'
    };
  }

  // Join URL with Query parameters
  joinUrlWithParams(baseUrl, params) {
    let url = baseUrl;
    const queryString = Object.keys(params).map(function(key) {
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }).join('&');

    if (queryString !== '') {
      url = `${url}?${queryString}`;
    }
    return url;
  }

  // URL
  url(path) {
    return `${this.baseUrl}/${path}`;
  }
}

class Auth extends Request {
  // API Client Authentication
  apiClientAuth(clientId, clientSecret) {
    const url = `${this.baseUrl}/api/oauth/token`;
    const headers = {
      Accept: 'application/json'
    };
    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    };
    const key = 'access_token';
    return { url, headers, payload, key };
  }

  // Get Access Token
  getToken() {
    const properties = PropertiesService.getScriptProperties().getProperties();
    const clientId = properties.CLIENT_ID;
    const clientSecret = properties.CLIENT_SECRET;
    if (!(isDefined(clientId) && isDefined(clientSecret))) {
      alertNotSetProperty();
    }
    const auth = this.apiClientAuth(clientId, clientSecret);
    const res = this.request('post', auth.url, auth.headers, auth.payload);
    return res[auth.key];
  }
}

class ClassicApi extends Request {
  // URL
  url(path, params) {
    const url = `${this.baseUrl}/JSSResource/${path}`;
    return this.joinUrlWithParams(url, params);
  }

  // List
  list(path, params) {
    const url = this.url(path, params);
    return this.request('get', url);
  }

  // Get
  get(path, id, params) {
    const path_ = `${path}/id/${id}`;
    const url = this.url(path_, params);
    return this.request('get', url);
  }

  // Computer Group
  // https://developer.jamf.com/jamf-pro/reference/findcomputergroups
  getComputerGroups(params = {}) {
    return this.list('computergroups', params).computer_groups;
  }

  // https://developer.jamf.com/jamf-pro/reference/findcomputergroupsbyid
  getComputerGroup(id, params = {}) {
    return this.get('computergroups', id, params).computer_group;
  }

  // Policy
  // https://developer.jamf.com/jamf-pro/reference/findpolicies
  getPolicies(params = {}) {
    return this.list('policies', params).policies;
  }

  // https://developer.jamf.com/jamf-pro/reference/findpoliciesbyid
  getPolicy(id, params = {}) {
    return this.get('policies', id, params).policy;
  }

  // Package
  // https://developer.jamf.com/jamf-pro/reference/findpackages
  getPackages(params = {}) {
    return this.list('packages', params).packages;
  }

  // https://developer.jamf.com/jamf-pro/reference/findpackagesbyid
  getPackage(id, params = {}) {
    return this.get('packages', id, params).package;
  }

  // Script
  // https://developer.jamf.com/jamf-pro/reference/findscripts
  getScripts(params = {}) {
    return this.list('scripts', params).scripts;
  }

  // https://developer.jamf.com/jamf-pro/reference/findscriptsbyid
  getScript(id, params = {}) {
    return this.get('scripts', id, params).script;
  }

  // Configuration Profile
  // https://developer.jamf.com/jamf-pro/reference/findosxconfigurationprofiles
  getConfigurationProfiles(params = {}) {
    return this.list('osxconfigurationprofiles', params).os_x_configuration_profiles;
  }

  // https://developer.jamf.com/jamf-pro/reference/findosxconfigurationprofilesbyid
  getConfigurationProfile(id, params = {}) {
    return this.get('osxconfigurationprofiles', id, params).os_x_configuration_profile;
  }
}

class JamfProApi extends Request {
  // URL
  url(path, version) {
    return `${this.baseUrl}/api/${version}/${path}`;
  }

  // Pagination
  pagination(url, page, params, data_ = []) {
    const params_ = Object.assign(params, { page });
    const url_ = this.joinUrlWithParams(url, params_);
    const res = this.request('get', url_);
    let data = data_.concat(res.results);
    if (res.totalCount > data.length) {
      data = this.pagination(url, page + 1, params, data);
    }
    return data;
  }

  // List
  list(path, version, params) {
    const url = this.url(path, version);
    return this.pagination(url, 0, params);
  }

  // Get
  get(path, version, id, params) {
    const path_ = `${path}/${id}`;
    const url = this.joinUrlWithParams(this.url(path_, version), params);
    return this.request('get', url);
  }

  // Computer Prestage
  // https://developer.jamf.com/jamf-pro/reference/get_v3-computer-prestages
  getComputerPrestages(params = {}) {
    return this.list('computer-prestages', 'v3', params);
  }

  // https://developer.jamf.com/jamf-pro/reference/get_v3-computer-prestages-id
  getComputerPrestage(id, params = {}) {
    return this.get('computer-prestages', 'v3', id, params);
  }
}

class JamfClient { // eslint-disable-line no-unused-vars
  constructor() {
    const properties = PropertiesService.getScriptProperties().getProperties();
    const server = properties.SERVER;
    if (!(isDefined(server))) {
      alertNotSetProperty();
    }
    const baseUrl = `https://${server}`;
    const auth = new Auth(baseUrl);
    const token = auth.getToken();

    this.classic = new ClassicApi(baseUrl, token);
    this.pro = new JamfProApi(baseUrl, token);
  }

  // Computer Group
  getComputerGroups(params = {}) {
    return this.classic.getComputerGroups(params);
  }

  getComputerGroup(id, params = {}) {
    return this.classic.getComputerGroup(id, params);
  }

  // Policy
  getPolicies(params = {}) {
    return this.classic.getPolicies(params);
  }

  getPolicy(id, params = {}) {
    return this.classic.getPolicy(id, params);
  }

  // Package
  getPackages(params = {}) {
    return this.classic.getPackages(params);
  }

  getPackage(id, params = {}) {
    return this.classic.getPackage(id, params);
  }

  // Script
  getScripts(params = {}) {
    return this.classic.getScripts(params);
  }

  getScript(id, params = {}) {
    return this.classic.getScript(id, params);
  }

  // Configuration Profile
  getConfigurationProfiles(params = {}) {
    return this.classic.getConfigurationProfiles(params);
  }

  getConfigurationProfile(id, params = {}) {
    return this.classic.getConfigurationProfile(id, params);
  }

  // Computer Prestage
  getComputerPrestages(params = {}) {
    return this.pro.getComputerPrestages(params);
  }

  getComputerPrestage(id, params = {}) {
    return this.pro.getComputerPrestage(id, params);
  }
}
