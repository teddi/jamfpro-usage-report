/**
 * Determine if a property is defined
 * @param {*} property
 * @returns {boolean}
 */
function isDefined(property) {
  return (typeof property !== 'undefined');
}

/**
 * Alert if property is not defined
 */
function alertNotSetProperty() {
  throw new Error('Property is not set');
}

/**
 * Class representing a request
 * */
class Request {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Send a request to a web service
   * @param {string} method HTTP method
   * @param {string} url Endpoint URL
   * @param {Object} headers Request headers
   * @param {Object} payload Request payload
   * @returns Response
   */
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

  /**
   * Get common headers
   * @returns {Object} Headers
   */
  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json'
    };
  }

  /**
   * Join URL with Query parameters
   * @param {string} baseUrl Base URL
   * @param {Object} params Query parameters
   * @returns Concatenated URL
   */
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

  /**
   * Join URL with path
   * @param {string} path URL path
   * @returns Concatenated URL
   */
  url(path) {
    return `${this.baseUrl}/${path}`;
  }
}

/**
 * Class representing a request to the Jamf Pro Authentication API
 */
class Auth extends Request {
  /**
   * API Client Authentication
   * @param {string} clientId Client ID
   * @param {string} clientSecret Client Secret
   * @returns {Object} Authentication
   */
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

  /**
   * Get Access Token
   * @returns {string} Access Token
   */
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

/**
 * Class representing a request to the Jamf Classic API
 */
class ClassicApi extends Request {
  url(path, params) {
    const url = `${this.baseUrl}/JSSResource/${path}`;
    return this.joinUrlWithParams(url, params);
  }

  list(path, params) {
    const url = this.url(path, params);
    return this.request('get', url);
  }

  get(path, id, params) {
    const path_ = `${path}/id/${id}`;
    const url = this.url(path_, params);
    return this.request('get', url);
  }

  /**
   * Get all computer groups
   * https://developer.jamf.com/jamf-pro/reference/findcomputergroups
   */
  getComputerGroups(params = {}) {
    return this.list('computergroups', params).computer_groups;
  }

  /**
   * Get computer group
   * https://developer.jamf.com/jamf-pro/reference/findcomputergroupsbyid
   */
  getComputerGroup(id, params = {}) {
    return this.get('computergroups', id, params).computer_group;
  }

  /**
   * Get all policies
   * https://developer.jamf.com/jamf-pro/reference/findpolicies
   */
  getPolicies(params = {}) {
    return this.list('policies', params).policies;
  }

  /**
   * Get policy
   * https://developer.jamf.com/jamf-pro/reference/findpoliciesbyid
   */
  getPolicy(id, params = {}) {
    return this.get('policies', id, params).policy;
  }

  /**
   * Get all packages
   * https://developer.jamf.com/jamf-pro/reference/findpackages
   */
  getPackages(params = {}) {
    return this.list('packages', params).packages;
  }

  /**
   * Get package
   * https://developer.jamf.com/jamf-pro/reference/findpackagesbyid
   */
  getPackage(id, params = {}) {
    return this.get('packages', id, params).package;
  }

  /**
   * Get all scripts
   * https://developer.jamf.com/jamf-pro/reference/findscripts
   */
  getScripts(params = {}) {
    return this.list('scripts', params).scripts;
  }

  /**
   * Get script
   * https://developer.jamf.com/jamf-pro/reference/findscriptsbyid
   */
  getScript(id, params = {}) {
    return this.get('scripts', id, params).script;
  }

  /**
   * Get all computer configuration profiles
   * https://developer.jamf.com/jamf-pro/reference/findosxconfigurationprofiles
   */
  getConfigurationProfiles(params = {}) {
    return this.list('osxconfigurationprofiles', params).os_x_configuration_profiles;
  }

  /**
   * Get computer configuration profile
   * https://developer.jamf.com/jamf-pro/reference/findosxconfigurationprofilesbyid
   */
  getConfigurationProfile(id, params = {}) {
    return this.get('osxconfigurationprofiles', id, params).os_x_configuration_profile;
  }
}

/**
 * Class representing a request to the Jamf Pro API
 */
class JamfProApi extends Request {
  url(path, version) {
    return `${this.baseUrl}/api/${version}/${path}`;
  }

  /**
   * Retrieve all of the paginated data by repeated requests
   */
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

  list(path, version, params) {
    const url = this.url(path, version);
    return this.pagination(url, 0, params);
  }

  get(path, version, id, params) {
    const path_ = `${path}/${id}`;
    const url = this.joinUrlWithParams(this.url(path_, version), params);
    return this.request('get', url);
  }

  /**
   * Get all computer prestages
   * https://developer.jamf.com/jamf-pro/reference/get_v3-computer-prestages
   */
  getComputerPrestages(params = {}) {
    return this.list('computer-prestages', 'v3', params);
  }

  /**
   * Get computer prestage
   * https://developer.jamf.com/jamf-pro/reference/get_v3-computer-prestages-id
   */
  getComputerPrestage(id, params = {}) {
    return this.get('computer-prestages', 'v3', id, params);
  }
}

/**
 * Class representing a Jamf Client
 */
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

  /** Get all computer groups */
  getComputerGroups(params = {}) {
    return this.classic.getComputerGroups(params);
  }

  /** Get computer group */
  getComputerGroup(id, params = {}) {
    return this.classic.getComputerGroup(id, params);
  }

  /** Get all policies */
  getPolicies(params = {}) {
    return this.classic.getPolicies(params);
  }

  /** Get policy */
  getPolicy(id, params = {}) {
    return this.classic.getPolicy(id, params);
  }

  /** Get all packages */
  getPackages(params = {}) {
    return this.classic.getPackages(params);
  }

  /** Get package */
  getPackage(id, params = {}) {
    return this.classic.getPackage(id, params);
  }

  /** Get all scripts */
  getScripts(params = {}) {
    return this.classic.getScripts(params);
  }

  /** Get script */
  getScript(id, params = {}) {
    return this.classic.getScript(id, params);
  }

  /** Get all computer configuration profiles */
  getConfigurationProfiles(params = {}) {
    return this.classic.getConfigurationProfiles(params);
  }

  /** Get computer configuration profile */
  getConfigurationProfile(id, params = {}) {
    return this.classic.getConfigurationProfile(id, params);
  }

  /** Get all computer prestages */
  getComputerPrestages(params = {}) {
    return this.pro.getComputerPrestages(params);
  }

  /** Get computer prestage */
  getComputerPrestage(id, params = {}) {
    return this.pro.getComputerPrestage(id, params);
  }
}
