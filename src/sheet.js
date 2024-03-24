/**
 * Class to handle Google Sheets
 */
class Spreadsheet {
  constructor(sheetName = null) {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Set active sheet if sheet name is not specified
    if (sheetName) {
      this.sheet = this.spreadsheet.getSheetByName(sheetName);

      // If sheet does not exist, create new sheet
      if (!this.sheet) {
        this.sheet = this.spreadsheet.insertSheet();
        this.sheet.setName(sheetName);
      }
    } else {
      this.sheet = this.spreadsheet.getActiveSheet();
    }

    // Sheet activate
    this.sheet.activate();
  }

  /**
   * Get value from object
   * @param {Object} obj Object to inspect
   * @param {string} key Key name
   * @param {string|number} defaultValue Default value to return if key does not exist
   * @return {string|number} Key value
   */
  getValue(obj, key, defaultValue = null) {
    return obj?.[key] ?? defaultValue;
  }

  /**
   * Make headers
   * @param {Object} writeData Data to write
   * @returns {Array} Headers
   */
  makeHeaders(writeData) {
    const headers = new Set();
    writeData.forEach((obj) => {
      Object.keys(obj).forEach((key) => {
        headers.add(key);
      });
    });
    return [...headers];
  }

  /**
   * Write data to sheets in batches
   * @param {Object} writeData Data to write
   * @param {number} headerRowPos Header row position (default:1)
   */
  writeDataToSheet(writeData, headerRowPos = 1) {
    const data = [];

    // Check if data is empty
    if (writeData.length === 0) {
      return;
    }

    // Clear all data
    this.sheet.clear();

    // Headers
    const headers = this.makeHeaders(writeData);
    data.push(headers);

    // Values
    writeData.forEach((item) => {
      const values = [];
      headers.forEach((key) => {
        values.push(this.getValue(item, key, ''));
      });
      data.push(values);
    });

    // Write data
    this.sheet.getRange(headerRowPos, 1, data.length, headers.length).setValues(data);
  }
}
