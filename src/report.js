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
   * Retrieve items used in smart computer group's criteria
   * @param {Object} group Target computer group
   * @param {Object} criteria Smart computer group's criteria
   * @param {string} type Usage object type
   * @returns {Object} usage item
   */
  getCriteriaItem(group, criteria, type) {
    const item = this.template('computer_group', type);
    Object.assign(item, {
      id: group.id,
      name: group.name,
      usage_location: `criteria:${(criteria.search_type).replace(/ /g, '_')}`,
      usage_name: criteria.value
    });
    return item;
  }

  /**
   * Get all computer groups
   */
  getComputerGroups() {
    console.log('Get Computer Groups');
    const records = this.jamf.getComputerGroups();

    for (const record of records) {
      const group = this.jamf.getComputerGroup(record.id);
      if (group.is_smart === true) {
        for (const criteria of group.criteria) {
          // Computer Group
          if (criteria.name === 'Computer Group') {
            this.items.push(this.getCriteriaItem(group, criteria, 'computer_group'));

          // PreStage Enrollment
          } else if (criteria.name === 'Enrollment Method: PreStage enrollment') {
            this.items.push(this.getCriteriaItem(group, criteria, 'computer_prestage'));

          // Package
          } else if (
            criteria.name === 'Packages Installed By Casper' ||
            criteria.name === 'Packages Installed By Installer.app/SWU' ||
            criteria.name === 'Cached Packages'
          ) {
            this.items.push(this.getCriteriaItem(group, criteria, 'package'));

          // Configuration Profile
          } else if (criteria.name === 'Profile Name') {
            this.items.push(this.getCriteriaItem(group, criteria, 'configuration_profile'));
          }
        }
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

    for (const record of records) {
      const policy = this.jamf.getPolicy(record.id);

      // Computer Group - Targets
      this.addUsages(
        policy.scope.computer_groups,
        policy.general,
        'policy',
        'computer_group',
        'scope:targets');

      // Computer Group - Exclusions
      this.addUsages(
        policy.scope.exclusions.computer_groups,
        policy.general,
        'policy',
        'computer_group',
        'scope:exclusions');

      // Script
      this.addUsages(
        policy.scripts,
        policy.general,
        'policy',
        'script');

      // Package
      this.addUsages(
        policy.package_configuration.packages,
        policy.general,
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

    for (const record of records) {
      const profile = this.jamf.getConfigurationProfile(record.id);

      // Computer Group - Targets
      this.addUsages(
        profile.scope.computer_groups,
        profile.general,
        'configuration_profile',
        'computer_group',
        'scope:targets');

      // Computer Group - Exclusions
      this.addUsages(
        profile.scope.exclusions.computer_groups,
        profile.general,
        'configuration_profile',
        'computer_group',
        'scope:exclusions');
    }
  }

  /**
   * Get all computer prestages
   */
  getComputerPrestages() {
    console.log('Get Computer Prestages');
    const records = this.jamf.getComputerPrestages();
    for (const prestage of records) {
      // Custom Packages
      for (const id of prestage.customPackageIds) {
        const package_ = this.jamf.getPackage(id);
        const item = this.template('computer_prestage', 'package');
        Object.assign(item, {
          id: prestage.id,
          name: prestage.displayName,
          usage_id: package_.id,
          usage_name: package_.name
        });
        this.items.push(item);
      }

      // Configuration Profiles
      for (const id of prestage.prestageInstalledProfileIds) {
        const profile = this.jamf.getConfigurationProfile(id);
        const item = this.template('computer_prestage', 'configuration_profile');
        Object.assign(item, {
          id: prestage.id,
          name: prestage.displayName,
          usage_id: profile.general.id,
          usage_name: profile.general.name
        });
        this.items.push(item);
      }
    }
  }
}
