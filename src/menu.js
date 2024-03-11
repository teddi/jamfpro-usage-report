function onOpen() { // eslint-disable-line no-unused-vars
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Jamf Pro')
    .addItem('Update Resources', 'updateResources')
    .addItem('Update Report', 'updateReport')
    .addToUi();
}
