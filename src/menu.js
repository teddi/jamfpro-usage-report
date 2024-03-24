/**
 * Process executed when spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Jamf Pro')
    .addItem('Update Objects', 'updateObjects')
    .addItem('Update Report', 'updateReport')
    .addToUi();
}
