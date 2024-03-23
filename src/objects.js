/**
 * Update the Jamf Pro objects sheet
 */
function updateObjects() { // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-undef
  const spreadsheet = new Spreadsheet('Objects');

  console.log('Update Objects');
  const jamfObj = new JamfObject();

  console.log('Write data to sheet');
  spreadsheet.writeDataToSheet(jamfObj.objects);
}

/**
 * Class representing a Jamf object
 */
class JamfObject {
  constructor() {
    // eslint-disable-next-line no-undef
    this.jamf = new JamfClient();
    this.objects = [];

    this.getCategories();
    this.getComputerGroups();
    this.getPolicies();
    this.getConfigurationProfiles();
    this.getExtensionAttributes();
    this.getPackages();
    this.getScripts();
    this.getAdvancedComputerSearches();
    this.getComputerPrestages();
  }

  /**
   * Object template
   * @param {string} type Object type
   * @returns object
   */
  template(type) {
    return {
      type,
      id: null,
      name: null,
      is_smart: null,
      category: null,
      enabled: null,
      scope_targets: null,
      scope_limitations: null,
      scope_exclusions: null
    };
  }

  /**
   * Add records to objects
   * @param {string} type Object type
   * @param {Array} records Objects
   */
  addObjects(type, records) {
    for (const record of records) {
      const _obj = this.template(type);
      // Merge the template and record
      Object.assign(_obj, record);
      this.objects.push(_obj);
    }
  }

  /**
   * Get all categories
   */
  getCategories() {
    console.log('Get Categories');
    const records = this.jamf.getCategories();
    this.addObjects('category', records);
  }

  /**
   * Get all computer groups
   */
  getComputerGroups() {
    console.log('Get Computer Groups');
    const records = this.jamf.getComputerGroups();
    this.addObjects('computer_group', records);
  }

  /**
   * Make a list of names
   * @param {string} type Object type
   * @param {Array} records Objects
   * @returns {string} Type name + Comma-separated list of names
   */
  makeNameList(type, records) {
    const names = [];
    for (const r of records) {
      names.push(r.name);
    }
    return `${type}: [${names.join(', ')}]`;
  }

  /**
   * Make a list of scope
   * @param {Object} scope Scope
   * @returns {string} Comma-separated list of scopes
   */
  makeScopeList(scope) {
    const scopes = [];
    for (const key of Object.keys(scope)) {
      if (typeof scope[key] === 'boolean' && scope[key]) {
        scopes.push(key);
      } else if (Array.isArray(scope[key]) && scope[key].length > 0) {
        scopes.push(this.makeNameList(key, scope[key]));
      }
    }
    return scopes.join(', ');
  }

  /**
   * Get all policies
   */
  getPolicies() {
    console.log('Get Policies');
    const records = [];
    const records_ = this.jamf.getPolicies();
    for (const record of records_) {
      const r = this.jamf.getPolicy(record.id);
      records.push({
        id: r.general.id,
        name: r.general.name,
        category: r.general.category.name,
        enabled: r.general.enabled,
        scope_targets: this.makeScopeList(r.scope),
        scope_limitations: this.makeScopeList(r.scope.limitations),
        scope_exclusions: this.makeScopeList(r.scope.exclusions)
      });
    }
    this.addObjects('policy', records);
  }

  /**
   * Get all computer configuration profiles
   */
  getConfigurationProfiles() {
    console.log('Get Configuration Profiles');
    const records = [];
    const records_ = this.jamf.getConfigurationProfiles();
    for (const record of records_) {
      const r = this.jamf.getConfigurationProfile(record.id);
      records.push({
        id: r.general.id,
        name: r.general.name,
        category: r.general.category.name,
        scope_targets: this.makeScopeList(r.scope),
        scope_limitations: this.makeScopeList(r.scope.limitations),
        scope_exclusions: this.makeScopeList(r.scope.exclusions)
      });
    }
    this.addObjects('configuration_profile', records);
  }

  /**
   * Get all extension attributes
   */
  getExtensionAttributes() {
    console.log('Get Extension Attributes');
    const records = [];
    const records_ = this.jamf.getExtensionAttributes();
    for (const record of records_) {
      const r = this.jamf.getExtensionAttribute(record.id);
      records.push({
        id: r.id,
        name: r.name,
        enabled: r.enabled
      });
    }
    this.addObjects('extension_attribute', records);
  }

  /**
   * Get all advanced computer searches
   */
  getAdvancedComputerSearches() {
    console.log('Get Advanced Computer Searches');
    const records = this.jamf.getAdvancedComputerSearches();
    this.addObjects('advanced_computer_search', records);
  }

  /**
   * Get all packages
   */
  getPackages() {
    console.log('Get Packages');
    const records = [];
    const records_ = this.jamf.getPackages();
    for (const record of records_) {
      const r = this.jamf.getPackage(record.id);
      records.push({
        id: r.id,
        name: r.name,
        category: r.category
      });
    }
    this.addObjects('package', records);
  }

  /**
   * Get all scripts
   */
  getScripts() {
    console.log('Get Scripts');
    const records = [];
    const records_ = this.jamf.getScripts();
    for (const record of records_) {
      const r = this.jamf.getScript(record.id);
      records.push({
        id: r.id,
        name: r.name,
        category: r.category
      });
    }
    this.addObjects('script', records);
  }

  /**
   * Get all computer prestages
   */
  getComputerPrestages() {
    console.log('Get Computer Prestages');
    const records = [];
    const records_ = this.jamf.getComputerPrestages();
    for (const r of records_) {
      records.push({
        id: r.id,
        name: r.displayName
      });
    }
    this.addObjects('computer_prestage', records);
  }
}
