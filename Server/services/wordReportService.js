/**
 * FMG Catering Services — Professional Word Document Report Generator
 * Uses the `docx` v9 package to create a fully formatted .docx file.
 *
 * Design: Calibri body, Times New Roman headings, gold (#B8921F) table
 * headers, alternating row shading, professional layout matching an
 * ISO/IEC 25010-oriented business report template.
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  TableLayoutType,
  VerticalAlign,
  convertInchesToTwip,
  PageBreak,
} from 'docx';

// ── Colour palette ─────────────────────────────────────────────────────────
const GOLD        = 'B8921F';   // header fill
const GOLD_LIGHT  = 'FDF3D7';   // alternating row (odd)
const WHITE       = 'FFFFFF';
const DARK        = '1C1C1C';
const BORDER_COLOR= 'D4A017';

// ── Typography helpers ─────────────────────────────────────────────────────
const bodyFont  = 'Calibri';
const titleFont = 'Times New Roman';

const pt = (n) => n * 2;  // half-points (docx unit)

const bold = (text, size = 22, color = DARK, font = bodyFont) =>
  new TextRun({ text: String(text ?? ''), bold: true, size: pt(size), color, font });

const normal = (text, size = 22, color = DARK, font = bodyFont) =>
  new TextRun({ text: String(text ?? ''), size: pt(size), color, font });

const italic = (text, size = 20, color = '666666', font = bodyFont) =>
  new TextRun({ text: String(text ?? ''), italics: true, size: pt(size), color, font });

// ── Paragraph helpers ──────────────────────────────────────────────────────
const p = (children, opts = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], ...opts });

const centered = (children, opts = {}) =>
  p(children, { alignment: AlignmentType.CENTER, ...opts });

const spacedP = (children, spacingAfter = 100) =>
  p(children, { spacing: { after: spacingAfter } });

const bulletP = (text, size = 22) =>
  new Paragraph({
    children: [normal(text, size)],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });

// Section heading (bold, Times New Roman, 13pt, gold underline via border)
const sectionHeading = (text) =>
  new Paragraph({
    children: [
      new TextRun({
        text: String(text),
        bold: true,
        size: pt(13),
        color: GOLD,
        font: titleFont,
      }),
    ],
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: BORDER_COLOR, space: 4, style: BorderStyle.SINGLE, size: 6 },
    },
  });

// Sub-heading (bold, Calibri, 11pt, dark)
const subHeading = (text) =>
  new Paragraph({
    children: [bold(text, 11)],
    spacing: { before: 160, after: 80 },
  });

// ── Table helpers ──────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };

const tableBorder = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left:   { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right:  { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  insideH:{ style: BorderStyle.SINGLE, size: 2, color: 'E5D5A0' },
  insideV:{ style: BorderStyle.SINGLE, size: 2, color: 'E5D5A0' },
};

/** Gold header row */
const headerRow = (labels, widths) =>
  new TableRow({
    tableHeader: true,
    children: labels.map((label, i) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: String(label),
                bold: true,
                color: WHITE,
                size: pt(10),
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: GOLD, type: ShadingType.CLEAR, color: GOLD },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        width: widths ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined,
        borders: tableBorder,
      })
    ),
  });

/** Data row with alternating shading */
const dataRow = (cells, rowIndex, alignments = []) =>
  new TableRow({
    children: cells.map((cell, i) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [normal(cell, 10)],
            alignment: alignments[i] || AlignmentType.LEFT,
          }),
        ],
        shading: {
          fill: rowIndex % 2 === 0 ? GOLD_LIGHT : WHITE,
          type: ShadingType.CLEAR,
          color: rowIndex % 2 === 0 ? GOLD_LIGHT : WHITE,
        },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 50, bottom: 50, left: 80, right: 80 },
        borders: tableBorder,
      })
    ),
  });

/** Full table with header + data rows */
const makeTable = (headers, rows, widths, alignments) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorder,
    rows: [
      headerRow(headers, widths),
      ...rows.map((row, i) => dataRow(row, i, alignments)),
    ],
  });

// ── Currency / number helpers ──────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const fmtNum = (v) => {
  const n = Number(v);
  return !Number.isFinite(n) ? 'N/A' : new Intl.NumberFormat('en-PH').format(n);
};

const fmtDate = (iso) => {
  if (!iso) return 'N/A';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return isNaN(d)
    ? String(iso).slice(0, 10)
    : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ── Document assembly ──────────────────────────────────────────────────────

function buildCoverPage(metrics, meta) {
  return [
    p([]),
    p([]),
    centered([new TextRun({ text: 'FMG CATERING SERVICES', bold: true, size: pt(28), font: titleFont, color: GOLD })]),
    p([]),
    centered([new TextRun({ text: 'Monthly Sales Report', bold: true, size: pt(20), font: titleFont, color: DARK })]),
    p([]),
    centered([bold(`Reporting Period: ${metrics.monthLabel}`, 14)]),
    p([]),
    centered([normal(`Report ID: ${meta.reportId}`, 12)]),
    centered([normal(`Date Generated: ${fmtDate(meta.generatedAt)}`, 12)]),
    centered([normal(`Generated By: ${meta.generatedByName}`, 12)]),
    p([]),
    p([]),
    centered([italic('CONFIDENTIAL — For Internal Use Only')]),
    p([]),
    p([new PageBreak()]),
  ];
}

function buildSection1(metrics) {
  const rows = [
    ['Total Revenue / Sales', fmt(metrics.revenue)],
    ['Total Completed Bookings', fmtNum(metrics.completedCount)],
    ['Total Cancelled Bookings', fmtNum(metrics.cancelledCount)],
    ['Total Pending Bookings', fmtNum(metrics.pendingCount)],
    ['Average Revenue per Booking', metrics.averagePerBooking === null ? 'N/A' : fmt(metrics.averagePerBooking)],
    ['Highest Sales Day', metrics.highestSalesDay ? fmtDate(metrics.highestSalesDay) : 'N/A'],
    ['Highest-Selling Service/Package', metrics.mostBookedPackage?.name || 'N/A'],
  ];
  return [
    sectionHeading('SECTION 1 — MONTHLY SALES SUMMARY'),
    makeTable(['Metric', 'Value'], rows, [60, 40], [AlignmentType.LEFT, AlignmentType.RIGHT]),
    p([]),
  ];
}

function buildSection2(metrics) {
  const elements = [sectionHeading('SECTION 2 — SALES TRANSACTION DETAILS')];
  if (!metrics.transactions?.length) {
    elements.push(p([italic('No bookings were recorded during the selected month.')]));
    elements.push(p([]));
    return elements;
  }
  const headers = ['Booking ID', 'Customer', 'Event Date', 'Event Type', 'Package', 'Guests', 'Amount', 'Status'];
  const rows = metrics.transactions.map((t) => [
    t.bookingRef,
    t.customerName,
    t.eventDate,
    t.eventType,
    t.servicePackage,
    String(t.guests),
    fmt(t.amount),
    t.status,
  ]);
  elements.push(makeTable(headers, rows, [12, 14, 9, 10, 13, 6, 11, 9]));
  elements.push(p([]));
  return elements;
}

function buildSection3(metrics) {
  const elements = [sectionHeading('SECTION 3 — WEEKLY SALES PERFORMANCE')];
  if (!metrics.weeklyPerformance?.length) {
    elements.push(p([italic('No sales activity was recorded.')]));
    elements.push(p([]));
    return elements;
  }
  const headers = ['Week', 'Bookings', 'Total Sales', 'Avg per Booking'];
  const rows = [
    ...metrics.weeklyPerformance.map((w) => [
      `Week ${w.week}`,
      fmtNum(w.bookingsCount),
      fmt(w.totalSales),
      w.average === null ? 'N/A' : fmt(w.average),
    ]),
    [
      'MONTHLY TOTAL',
      fmtNum(metrics.monthTotal.bookingsCount),
      fmt(metrics.monthTotal.totalSales),
      metrics.monthTotal.average === null ? 'N/A' : fmt(metrics.monthTotal.average),
    ],
  ];
  // Bold the totals row separately
  const tableRows = [
    headerRow(headers),
    ...metrics.weeklyPerformance.map((w, i) =>
      dataRow([`Week ${w.week}`, fmtNum(w.bookingsCount), fmt(w.totalSales), w.average === null ? 'N/A' : fmt(w.average)], i, [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.RIGHT, AlignmentType.RIGHT])
    ),
    new TableRow({
      children: [
        'MONTHLY TOTAL',
        fmtNum(metrics.monthTotal.bookingsCount),
        fmt(metrics.monthTotal.totalSales),
        metrics.monthTotal.average === null ? 'N/A' : fmt(metrics.monthTotal.average),
      ].map((cell) =>
        new TableCell({
          children: [new Paragraph({ children: [bold(cell, 10)], alignment: AlignmentType.RIGHT })],
          shading: { fill: 'E8D8A0', type: ShadingType.CLEAR, color: 'E8D8A0' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          borders: tableBorder,
        })
      ),
    }),
  ];
  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: tableBorder,
      rows: tableRows,
    })
  );
  elements.push(p([]));
  return elements;
}

function buildSection4(metrics) {
  const elements = [sectionHeading('SECTION 4 — SALES PERFORMANCE BY SERVICE / PACKAGE')];
  const headers = ['Service / Package', 'Bookings', 'Total Sales', '% of Total', 'Classification'];
  const widths = [30, 12, 18, 15, 25];

  if (metrics.servicePerformance?.length) {
    elements.push(subHeading('By Event Type'));
    elements.push(makeTable(headers, metrics.servicePerformance.map((s) => [
      s.name, fmtNum(s.bookingsCount), fmt(s.totalSales),
      s.percentage ? `${s.percentage.toFixed(1)}%` : '0.0%', s.classification,
    ]), widths));
    elements.push(p([]));
  }
  if (metrics.packagePerformance?.length) {
    elements.push(subHeading('By Package'));
    elements.push(makeTable(headers, metrics.packagePerformance.map((p) => [
      p.name, fmtNum(p.bookingsCount), fmt(p.totalSales),
      p.percentage ? `${p.percentage.toFixed(1)}%` : '0.0%', p.classification,
    ]), widths));
    elements.push(p([]));
  }
  return elements;
}

function buildSection5(metrics, prevMetrics) {
  const elements = [sectionHeading('SECTION 5 — SALES ANALYTICS')];
  const changePercent = (curr, prev) => {
    if (prev == null || Number(prev) === 0) return null;
    return ((Number(curr) - Number(prev)) / Number(prev)) * 100;
  };
  const describe = (pct) => {
    if (pct === null) return 'insufficient prior-period data for comparison';
    if (Math.abs(pct) < 0.5) return 'no measurable change versus the prior month';
    return `${pct >= 0 ? 'increased' : 'decreased'} by ${Math.abs(pct).toFixed(1)}% versus the prior month`;
  };

  const revChange = changePercent(metrics.revenue, prevMetrics?.revenue);
  const bkChange  = changePercent(metrics.bookingsCount, prevMetrics?.bookingsCount);

  elements.push(bulletP(`Overall sales trend: Revenue of ${fmt(metrics.revenue)} was recorded for ${metrics.monthLabel}; ${describe(revChange)}.`));
  elements.push(bulletP(`Booking volume: ${fmtNum(metrics.bookingsCount)} booking(s) — ${describe(bkChange)}.`));

  const activeWeeks = (metrics.weeklyPerformance || []).filter((w) => w.bookingsCount > 0);
  if (activeWeeks.length > 0) {
    const best  = [...activeWeeks].sort((a, b) => b.totalSales - a.totalSales)[0];
    const worst = [...activeWeeks].sort((a, b) => a.totalSales - b.totalSales)[0];
    elements.push(bulletP(`High-performing week: Week ${best.week} — ${fmt(best.totalSales)} (${fmtNum(best.bookingsCount)} booking(s)).`));
    if (worst.week !== best.week) {
      elements.push(bulletP(`Low-performing week: Week ${worst.week} — ${fmt(worst.totalSales)} (${fmtNum(worst.bookingsCount)} booking(s)).`));
    }
  }
  if (metrics.mostBookedService) elements.push(bulletP(`Most requested event type: ${metrics.mostBookedService.name} (${fmtNum(metrics.mostBookedService.bookingsCount)} booking(s)).`));
  if (metrics.mostBookedPackage) elements.push(bulletP(`Most requested package: ${metrics.mostBookedPackage.name} (${fmtNum(metrics.mostBookedPackage.bookingsCount)} booking(s)).`));
  elements.push(p([]));
  return elements;
}

function buildSection6(metrics) {
  const elements = [sectionHeading('SECTION 6 — DATA-DRIVEN RECOMMENDATIONS')];
  const highPerformers = (metrics.packagePerformance || []).filter((p) => p.classification === 'High Performing' && p.bookingsCount > 0);
  const lowPerformers  = (metrics.packagePerformance || []).filter((p) => p.classification === 'Low Performing'  && p.bookingsCount > 0);
  const zeroBookings   = (metrics.packagePerformance || []).filter((p) => p.bookingsCount === 0);
  const lowWeeks       = (metrics.weeklyPerformance || []).filter((w) => w.bookingsCount === 0);

  elements.push(subHeading('What is performing well?'));
  if (highPerformers.length) {
    highPerformers.forEach((hp) => elements.push(bulletP(`${hp.name}: ${fmt(hp.totalSales)} revenue, ${fmtNum(hp.bookingsCount)} booking(s) (${hp.percentage.toFixed(1)}% of total sales).`)));
  } else {
    elements.push(bulletP('No single package exceeded 30% of sales. Consider reviewing package positioning.'));
  }
  if (metrics.mostBookedService) elements.push(bulletP(`${metrics.mostBookedService.name} generated the most requests this month.`));

  elements.push(subHeading('What needs improvement?'));
  if (lowPerformers.length) lowPerformers.forEach((lp) => elements.push(bulletP(`${lp.name} contributed only ${lp.percentage.toFixed(1)}% of sales — consider repackaging or a promotion.`)));
  if (zeroBookings.length) elements.push(bulletP(`${zeroBookings.map((p) => p.name).join(', ')} — received no bookings; review visibility and pricing.`));
  if (lowWeeks.length) elements.push(bulletP(`${lowWeeks.map((w) => `Week ${w.week}`).join(', ')} recorded no bookings; consider targeted promotions.`));
  if (metrics.cancelledCount > 0) elements.push(bulletP(`${fmtNum(metrics.cancelledCount)} booking(s) were cancelled; review follow-up and deposit procedures.`));
  if (!lowPerformers.length && !zeroBookings.length && !lowWeeks.length && !metrics.cancelledCount) {
    elements.push(bulletP('Performance was broadly positive; continue monitoring weekly patterns.'));
  }

  elements.push(subHeading('What should the business consider?'));
  elements.push(bulletP(`Promote ${highPerformers[0]?.name || 'top-performing packages'} to repeat customers and new leads.`));
  if (lowWeeks.length) elements.push(bulletP(`Target promotional activity during ${lowWeeks.map((w) => `Week ${w.week}`).join(', ')} to fill slow periods.`));
  elements.push(bulletP('Use the automated email feature to reach customers with upcoming recurring events ~30 days in advance.'));

  elements.push(p([italic('Recommendations are generated by rule-based analysis of historical data — not machine learning.')]));
  elements.push(p([]));
  return elements;
}

function buildSection7(metrics) {
  const rows = [
    ['Total Customers / Clients', fmtNum(metrics.insights.totalCustomers)],
    ['New Customers', fmtNum(metrics.insights.newCustomers)],
    ['Returning Customers', fmtNum(metrics.insights.returningCustomers)],
    ['Most Common Event Type', metrics.insights.mostCommonEventType],
    ['Most Requested Package', metrics.insights.mostRequestedPackage],
    ['Most Common Booking Period', metrics.insights.mostCommonBookingPeriod],
  ];
  return [
    sectionHeading('SECTION 7 — CUSTOMER & BOOKING INSIGHTS'),
    makeTable(['Insight', 'Value'], rows, [55, 45]),
    p([]),
  ];
}

function buildSection8(metrics) {
  const elements = [sectionHeading('SECTION 8 — PROMOTIONAL OPPORTUNITIES')];
  if (!metrics.promotions?.length) {
    elements.push(p([italic('No customers have an upcoming recurring event within the promotional window for this period.')]));
    elements.push(p([]));
    return elements;
  }
  elements.push(p([normal('Customers with an upcoming event anniversary within the next 24–40 days:', 11)]));
  elements.push(p([]));
  const headers = ['Customer', 'Occasion Date', 'Event Type', 'Recommended Send', 'Status'];
  elements.push(makeTable(headers, metrics.promotions.map((pr) => [
    pr.customerName, pr.occasionDate, pr.eventType, pr.recommendedSend, pr.status,
  ]), [22, 22, 16, 18, 22]));
  elements.push(p([]));
  return elements;
}

function buildSection9(metrics, prevMetrics) {
  const elements = [sectionHeading('SECTION 9 — MONTHLY CONCLUSION')];
  const changePct = (curr, prev) => (prev && Number(prev) !== 0 ? ((Number(curr) - Number(prev)) / Number(prev)) * 100 : null);
  const revChange = changePct(metrics.revenue, prevMetrics?.revenue);
  const trendNote = revChange === null
    ? 'baseline month (no prior period data available)'
    : revChange >= 10 ? 'revenue grew strongly versus the prior month'
    : revChange <= -10 ? 'revenue declined versus the prior month'
    : 'performance was broadly stable versus the prior month';

  elements.push(bulletP(`Overall sales performance: ${fmt(metrics.revenue)} in revenue across ${fmtNum(metrics.bookingsCount)} booking(s) for ${metrics.monthLabel}; ${trendNote}.`));
  if (metrics.highestSalesDay) {
    elements.push(bulletP(`Best sales day: ${fmtDate(metrics.highestSalesDay)} (${fmt(metrics.highestSalesValue)}).`));
  }
  const zeroPackages = (metrics.packagePerformance || []).filter((p) => p.bookingsCount === 0);
  if (zeroPackages.length) {
    elements.push(bulletP(`Packages needing attention: ${zeroPackages.map((p) => p.name).join(', ')} — recorded no bookings this month.`));
  }
  elements.push(bulletP('Key recommendation: Continue promoting high-performing packages and re-engage past customers via promotional email.'));
  elements.push(p([]));
  return elements;
}

function buildFooterPage(meta) {
  return [
    sectionHeading('SECTION 10 — REPORT FOOTER'),
    makeTable(
      ['Field', 'Signature / Details'],
      [
        ['Prepared by', '________________________________'],
        ['Reviewed by', '________________________________'],
        ['Approved by', '________________________________'],
        ['Date', '________________________________'],
      ],
      [40, 60]
    ),
    p([]),
    p([italic(`Generated by FMG Catering Services Internal Sales Management System  ·  ${meta.reportId}`)]),
  ];
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build a professional Word document (.docx) from report metrics.
 * Returns a Buffer containing the full .docx file.
 *
 * @param {object} metrics   - from collectMonthData()
 * @param {object} prevMetrics - prior month metrics for comparison
 * @param {object} meta      - { reportId, generatedAt, generatedByName }
 * @returns {Promise<Buffer>}
 */
export async function buildWordDocument(metrics, prevMetrics, meta) {
  const headerWidget = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'FMG Catering Services  |  Monthly Sales Report', size: pt(9), color: '888888', font: bodyFont }),
          new TextRun({ text: `  |  ${metrics.monthLabel}`, size: pt(9), color: '888888', font: bodyFont }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  });

  const footerWidget = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `Report ID: ${meta.reportId}  |  Page `, size: pt(9), color: '888888', font: bodyFont }),
          new TextRun({ children: [PageNumber.CURRENT], size: pt(9), color: '888888', font: bodyFont }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });

  const bodyContent = [
    ...buildCoverPage(metrics, meta),
    ...buildSection1(metrics),
    ...buildSection2(metrics),
    ...buildSection3(metrics),
    ...buildSection4(metrics),
    ...buildSection5(metrics, prevMetrics),
    ...buildSection6(metrics),
    ...buildSection7(metrics),
    ...buildSection8(metrics),
    ...buildSection9(metrics, prevMetrics),
    ...buildFooterPage(meta),
  ];

  const doc = new Document({
    creator: 'FMG Catering Services Management System',
    title: `FMG Monthly Sales Report — ${metrics.monthLabel}`,
    description: 'Auto-generated monthly sales summary',
    styles: {
      default: {
        document: {
          run: { font: bodyFont, size: pt(11), color: DARK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left:   convertInchesToTwip(1.2),
              right:  convertInchesToTwip(1.2),
            },
          },
        },
        headers: { default: headerWidget },
        footers: { default: footerWidget },
        children: bodyContent,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
