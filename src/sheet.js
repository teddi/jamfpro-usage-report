class Spreadsheet { // eslint-disable-line no-unused-vars
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
  }

  writeDataToSheet(writeData, headerRowPos = 1) {
    const data = [];

    // Clear all data
    this.sheet.clear();

    // Headers
    const headers = [];
    const headerData = Object.keys(writeData[0]);
    for (let j = 0; j < headerData.length; j++) {
      headers.push(headerData[j]);
    }
    data.push(headers);

    // Values
    for (let i = 0; i < writeData.length; i++) {
      const values = [];
      const rowData = writeData[i];
      const keys = Object.keys(rowData);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const val = rowData[key];
        values.push(val);
      }
      data.push(values);
    }

    // Write data
    this.sheet.getRange(headerRowPos, 1, data.length, headers.length).setValues(data);
  }
}
