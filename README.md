The Jamf Pro Usage Report is a tool for exporting Jamf Pro object usage to a spreadsheet for review.

Smart Computer Group has a feature called "Reports", but this is not available for other objects.

## Sheets

### Objects

The following is a list of objects.

- category
- computer_group
- policy
- configuration_profile
- package
- script
- advanced_computer_search
- advanced_computer_search

### Report

A report showing the status of where each object is being used.

## Configuration

### Prerequisites

- Google Apps Script API must have been activated
- clasp package installation and Google account authentication must be completed.

### Creating API roles and clients

Create an API role in Jamf Pro that includes the following permissions, and create an API client to which the role is assigned.

[Required Permissions]

- Read macOS Configuration Profiles
- Read Advanced Computer Searches
- Read Smart Computer Groups
- Read Categories
- Read Packages
- Read Computer Extension Attributes
- Read Static Computer Groups
- Read Policies
- Read Scripts
- Read Computer PreStage Enrollments

### Create a Google Apps Script

- Create a new spreadsheet and create an Apps Script project
- Copy the script ID of your Apps Script project
- Copy .clasp.json.sample to create .clasp.json
- Edit the .clasp.json file and set the `scriptId` value to the script ID you copied
- Deploy the script with `clasp push`.

### Configure the properties

- Open the Apps Script project configuration window
- Click Edit Script Properties
- Add the following properties
  - `SERVER`: e.g. mycompany.jamfcloud.com
  - `CLIENT_ID`: Client ID of the API client you created. (AUTH_METHOD: oauth2)
  - `CLIENT_SECRET`: Client secret of the created API client. (AUTH_METHOD: oauth2)
  - `AUTH_METHDO`: oauth2 or basic (oauth2 if undefined)
  - `USERNAME`: The Jamf Pro username for Basic authentication (AUTH_METHOD: basic)
  - `PASSWORD`: Password for the Jamf Pro user for basic authentication (AUTH_METHOD: basic)
## Create a report

- Open the spreadsheet
  - If it is already open, reload it.
- A menu `Jamf Pro` will be added
- Select one of the menus and run it to generate the report
  - `Update Objects`: creates a list of objects.
  - `Update Report`: Generates a usage report.
  - Allow Google account only for the first time.
