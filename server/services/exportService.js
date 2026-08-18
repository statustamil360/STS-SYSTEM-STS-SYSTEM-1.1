const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  TextRun, HeadingLevel, WidthType, AlignmentType,
} = require('docx');

const FORMATS = {
  csv: { extension: 'csv', mimeType: 'text/csv; charset=utf-8' },
  excel: { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  pdf: { extension: 'pdf', mimeType: 'application/pdf' },
  word: { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

const cellText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const buildCsv = (columns, rows) => {
  const escape = (value) => {
    const text = cellText(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [columns.map((c) => escape(c.header)).join(',')];
  rows.forEach((row) => {
    lines.push(columns.map((c) => escape(row[c.key])).join(','));
  });

  // BOM keeps Excel from mangling non-ASCII characters.
  return Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8');
};

const buildExcel = async (columns, rows, { title, subtitle }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AMC Teleconference System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Conferences', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  sheet.columns = columns.map((c) => ({
    key: c.key,
    width: c.width || 20,
  }));

  const lastColumn = String.fromCharCode(64 + columns.length);

  sheet.mergeCells(`A1:${lastColumn}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 15, bold: true, color: { argb: 'FF1E3A5F' } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(`A2:${lastColumn}2`);
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = subtitle;
  subtitleCell.font = { size: 10, color: { argb: 'FF64748B' } };

  const headerRow = sheet.getRow(4);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } } };
  });
  headerRow.height = 20;

  rows.forEach((row, rowIndex) => {
    const sheetRow = sheet.getRow(5 + rowIndex);
    columns.forEach((column, index) => {
      const cell = sheetRow.getCell(index + 1);
      cell.value = cellText(row[column.key]);
      cell.alignment = { vertical: 'middle' };
      if (rowIndex % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }
    });
  });

  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const buildPdf = (columns, rows, { title, subtitle }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWeight = columns.reduce((sum, c) => sum + (c.width || 20), 0);
  const widths = columns.map((c) => ((c.width || 20) / totalWeight) * pageWidth);

  doc.fillColor('#1E3A5F').fontSize(17).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
  doc.fillColor('#64748B').fontSize(9).font('Helvetica').text(subtitle);
  doc.moveDown(0.8);

  const drawHeader = () => {
    const y = doc.y;
    doc.rect(doc.page.margins.left, y - 3, pageWidth, 20).fill('#1E3A5F');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    let x = doc.page.margins.left;
    columns.forEach((column, index) => {
      doc.text(column.header, x + 5, y + 2, { width: widths[index] - 10, ellipsis: true });
      x += widths[index];
    });
    doc.y = y + 22;
    doc.fillColor('#0F172A').font('Helvetica').fontSize(8);
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      drawHeader();
    }

    const y = doc.y;
    if (rowIndex % 2 === 1) {
      doc.rect(doc.page.margins.left, y - 2, pageWidth, 18).fill('#F1F5F9');
      doc.fillColor('#0F172A');
    }

    let x = doc.page.margins.left;
    columns.forEach((column, index) => {
      doc.fillColor('#0F172A').text(cellText(row[column.key]), x + 5, y + 2, {
        width: widths[index] - 10,
        ellipsis: true,
        lineBreak: false,
      });
      x += widths[index];
    });
    doc.y = y + 18;
  });

  if (!rows.length) {
    doc.moveDown(1).fillColor('#64748B').fontSize(10).text('No records found for the selected filters.');
  }

  doc.end();
});

const buildWord = async (columns, rows, { title, subtitle }) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map((column) => new TableCell({
      shading: { fill: '1E3A5F' },
      children: [new Paragraph({
        children: [new TextRun({ text: column.header, bold: true, color: 'FFFFFF', size: 18 })],
      })],
    })),
  });

  const bodyRows = rows.map((row, rowIndex) => new TableRow({
    children: columns.map((column) => new TableCell({
      shading: rowIndex % 2 === 1 ? { fill: 'F1F5F9' } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text: cellText(row[column.key]), size: 18 })],
      })],
    })),
  }));

  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title, bold: true, color: '1E3A5F' })],
    }),
    new Paragraph({
      children: [new TextRun({ text: subtitle, color: '64748B', size: 18 })],
    }),
    new Paragraph({ text: '' }),
  ];

  if (rows.length) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
    }));
  } else {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'No records found for the selected filters.', italics: true, color: '64748B' })],
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
};

/**
 * Renders tabular data into a downloadable document.
 * Returns the file buffer plus the metadata needed for response headers.
 */
const buildExport = async (format, { columns, rows, title, subtitle, fileName }) => {
  const normalized = String(format || 'csv').toLowerCase();
  const config = FORMATS[normalized];
  if (!config) {
    const error = new Error(`Unsupported export format: ${format}`);
    error.statusCode = 400;
    throw error;
  }

  const meta = { title, subtitle };
  let buffer;
  if (normalized === 'csv') buffer = buildCsv(columns, rows);
  else if (normalized === 'excel') buffer = await buildExcel(columns, rows, meta);
  else if (normalized === 'pdf') buffer = await buildPdf(columns, rows, meta);
  else buffer = await buildWord(columns, rows, meta);

  return {
    buffer,
    mimeType: config.mimeType,
    fileName: `${fileName}.${config.extension}`,
  };
};

module.exports = { buildExport, EXPORT_FORMATS: Object.keys(FORMATS) };
