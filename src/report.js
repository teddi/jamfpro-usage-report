/**
 * Update the Jamf Pro objects usage report
 */
function updateReport() { // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-undef
  const spreadsheet = new Spreadsheet('Report');

  console.log('Update Objects');
  const report = new UsageReport();

  console.log('Write data to sheet');
  spreadsheet.writeDataToSheet(report.items);
}

/**
 * Class representing a usage report
 */
class UsageReport {
  constructor() {
    // eslint-disable-next-line no-undef
    this.jamf = new JamfClient();
    this.items = [];

    this.getComputerGroups();
    this.getPolicies();
    this.getConfigurationProfiles();
    this.getAdvancedComputerSearches();
    this.getComputerPrestages();
  }

  /**
   * Usage item template
   * @param {string} type Object type
   * @param {string} usageType Usage object type
   * @returns {Object} usage item
   */
  template(type, usageType) {
    return {
      type,
      id: null,
      name: null,
      category: null,
      enabled: null,
      usage_type: usageType,
      usage_location: null,
      usage_id: null,
      usage_name: null
    };
  }

  /**
   * Retrieve item used in criteria
   * @param {Object} id id
   * @param {Object} name name
   * @param {Object} criteria criteria
   * @param {string} type object type
   * @param {string} usageType Usage object type
   * @returns {Object} usage item
   */
  getCriteriaItem(id, name, criteria, type, usageType) {
    const item = this.template(type, usageType);
    Object.assign(item, {
      id,
      name,
      usage_location: `criteria:${(criteria.search_type).replace(/ /g, '_')}`,
      usage_name: criteria.value
    });
    return item;
  }

  /**
   * Retrieves items used in criteria
   * @param {string} type Object type
   * @param {Object} record Record
   */
  getCriteriaItems(type, record) {
    for (const criteria of record.criteria) {
      const id = record.id;
      const name = record.name;

      // Computer Group
      if (criteria.name === 'Computer Group') {
        this.items.push(this.getCriteriaItem(id, name, criteria, type, 'computer_group'));

      // PreStage Enrollment
      } else if (criteria.name === 'Enrollment Method: PreStage enrollment') {
        this.items.push(this.getCriteriaItem(id, name, criteria, type, 'computer_prestage'));

      // Package
      } else if (
        criteria.name === 'Packages Installed By Casper' ||
        criteria.name === 'Packages Installed By Installer.app/SWU' ||
        criteria.name === 'Cached Packages'
      ) {
        this.items.push(this.getCriteriaItem(id, name, criteria, type, 'package'));

      // Configuration Profile
      } else if (criteria.name === 'Profile Name') {
        this.items.push(this.getCriteriaItem(id, name, criteria, type, 'configuration_profile'));
      }
    }
  }

  /**
   * Get all computer groups
   */
  getComputerGroups() {
    console.log('Get Computer Groups');
    const type = 'computer_group';
    const records = this.jamf.getComputerGroups();

    for (const record_ of records) {
      const record = this.jamf.getComputerGroup(record_.id);
      if (record.is_smart === true) {
        this.getCriteriaItems(type, record);
      }
    }
  }

  /**
   * Add usages to the items
   * @param {Array} usages Usages
   * @param {Object} general General object
   * @param {string} type Object type
   * @param {string} usageType Usage object type
   * @param {string} usageLocation Usage location
   */
  addUsages(usages, general, type, usageType, usageLocation = null) {
    for (const usage of usages) {
      const item = this.template(type, usageType);
      Object.assign(item, {
        id: general.id,
        name: general.name,
        category: general.category.name,
        enabled: general.enabled,
        usage_location: usageLocation,
        usage_id: usage.id,
        usage_name: usage.name
      });
      this.items.push(item);
    }
  }

  /**
   * Get all policies
   */
  getPolicies() {
    console.log('Get Policies');
    const records = this.jamf.getPolicies();

    for (const record_ of records) {
      const record = this.jamf.getPolicy(record_.id);

      // Computer Group - Targets
      this.addUsages(
        record.scope.computer_groups,
        record.general,
        'policy',
        'computer_group',
        'scope:targets');

      // Computer Group - Exclusions
      this.addUsages(
        record.scope.exclusions.computer_groups,
        record.general,
        'policy',
        'computer_group',
        'scope:exclusions');

      // Script
      this.addUsages(
        record.scripts,
        record.general,
        'policy',
        'script');

      // Package
      this.addUsages(
        record.package_configuration.packages,
        record.general,
        'policy',
        'package');
    }
  }

  /**
   * Get all computer configuration profiles
   */
  getConfigurationProfiles() {
    console.log('Get Configuration Profiles');
    const records = this.jamf.getConfigurationProfiles();

    for (const record_ of records) {
      const record = this.jamf.getConfigurationProfile(record_.id);

      // Computer Group - Targets
      this.addUsages(
        record.scope.computer_groups,
        record.general,
        'configuration_profile',
        'computer_group',
        'scope:targets');

      // Computer Group - Exclusions
      this.addUsages(
        record.scope.exclusions.computer_groups,
        record.general,
        'configuration_profile',
        'computer_group',
        'scope:exclusions');
    }
  }

  /**
   * Get all advanced computer searches
   */
  getAdvancedComputerSearches() {
    console.log('Get Advanced Computer Searches');
    const type = 'advanced_computer_search';
    const records = this.jamf.getAdvancedComputerSearches();

    for (const record_ of records) {
      const record = this.jamf.getAdvancedComputerSearch(record_.id);
      this.getCriteriaItems(type, record);
    }
  }

  /**
   * Get all computer prestages
   */
  getComputerPrestages() {
    console.log('Get Computer Prestages');
    const records = this.jamf.getComputerPrestages();
    for (const record of records) {
      // Custom Packages
      for (const id of record.customPackageIds) {
        const package_ = this.jamf.getPackage(id);
        const item = this.template('computer_prestage', 'package');
        Object.assign(item, {
          id: record.id,
          name: record.displayName,
          usage_id: package_.id,
          usage_name: package_.name
        });
        this.items.push(item);
      }

      // Configuration Profiles
      for (const id of record.prestageInstalledProfileIds) {
        const profile = this.jamf.getConfigurationProfile(id);
        const item = this.template('computer_prestage', 'configuration_profile');
        Object.assign(item, {
          id: record.id,
          name: record.displayName,
          usage_id: profile.general.id,
          usage_name: profile.general.name
        });
        this.items.push(item);
      }
    }
  }
}
