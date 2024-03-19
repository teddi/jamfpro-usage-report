/**
 * Process executed when spreadsheet is opened
 */
function onOpen() { // eslint-disable-line no-unused-vars
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Jamf Pro')
    .addItem('Update Objects', 'updateObjects')
    .addItem('Update Report', 'updateReport')
    .addToUi();
}
