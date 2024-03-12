function updateResources() { // eslint-disable-line no-unused-vars
  console.log('Update Resources');
  const resource = new Resource();

  console.log('Write data to sheet');
  // eslint-disable-next-line no-undef
  const spreadsheet = new Spreadsheet('Resources');
  spreadsheet.writeDataToSheet(resource.items);
}

class Resource {
  constructor() {
    // eslint-disable-next-line no-undef
    this.jamf = new JamfClient();
    this.items = [];

    this.getComputerGroups();
    this.getPolicies();
    this.getConfigurationProfiles();
    this.getPackages();
    this.getScripts();
    this.getComputerPrestages();
  }

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

  addResources(type, records) {
    for (const record of records) {
      const item = this.template(type);
      Object.assign(item, record);
      this.items.push(item);
    }
  }

  getComputerGroups() {
    console.log('Get Computer Groups');
    const records = this.jamf.getComputerGroups();
    this.addResources('computer_group', records);
  }

  makeNameList(type, records) {
    const names = [];
    for (const r of records) {
      names.push(r.name);
    }
    return `${type}: [${names.join(', ')}]`;
  }

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
    this.addResources('policy', records);
  }

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
    this.addResources('configuration_profile', records);
  }

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
    this.addResources('package', records);
  }

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
    this.addResources('script', records);
  }

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
    this.addResources('computer_prestage', records);
  }
}
