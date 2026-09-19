const TRANSPORT_LABELS = {
  car:    { he: '🚗 רכב שכור', en: '🚗 Rental Car' },
  bus:    { he: '🚌 אוטובוס',  en: '🚌 Bus' },
  train:  { he: '🚂 רכבת',     en: '🚂 Train' },
  metro:  { he: '🚇 מטרו',     en: '🚇 Metro' },
  flight: { he: '✈️ טיסה',     en: '✈️ Flight' },
  ferry:  { he: '⛴️ מעבורת',   en: '⛴️ Ferry' },
  walk:   { he: '🚶 רגלי',     en: '🚶 Walking' },
};

const STATUS_LABELS = {
  booked:      { he: 'מוזמן',   en: 'Booked' },
  considering: { he: 'שוקל',    en: 'Considering' },
  visited:     { he: 'ביקרתי',  en: 'Visited' },
  abandoned:   { he: 'ויתרתי',  en: 'Skipped' },
};

const TYPE_LABELS = {
  hotel:      { he: 'מלון',          en: 'Hotel' },
  attraction: { he: 'אטרקציה',       en: 'Attraction' },
  restaurant: { he: 'מסעדה',         en: 'Restaurant' },
  shopping:   { he: 'שופינג',        en: 'Shopping' },
  area:       { he: 'איזור להסתובב', en: 'Area' },
  other:      { he: 'אחר',           en: 'Other' },
};

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(dateStr, lang) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = lang === 'he' ? DAY_NAMES_HE[d.getDay()] : DAY_NAMES_EN[d.getDay()];
  if (lang === 'he') {
    return `יום ${dayName}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  }
  return `${dayName}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printItinerary(store) {
  const { tripName, days, places, language: lang } = store;
  const isHe = lang === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  const daysHtml = sortedDays.map((day, idx) => {
    // Transport
    const transports = day.transports?.length
      ? day.transports
      : day.transportMode ? [{ mode: day.transportMode, details: day.transportDetails }] : [];
    const transportHtml = transports.length
      ? `<div class="transport-row">${transports.map((tr) => {
          const lbl = TRANSPORT_LABELS[tr.mode]?.[lang] ?? tr.mode;
          return `<span class="transport-chip">${esc(lbl)}${tr.details ? ` · ${esc(tr.details)}` : ''}</span>`;
        }).join('')}</div>`
      : '';

    // Accommodation
    const accomName = day.accommodationName
      || (day.accommodationId ? places.find((p) => p.id === day.accommodationId)?.name : null);
    const accomHtml = accomName
      ? `<div class="accom">🏨 ${esc(accomName)}${day.freeCancellation
          ? ` <span class="cancel-tag">🔓 ${isHe ? 'ביטול חינם' : 'Free cancel'}: ${esc(day.freeCancellation)}</span>`
          : ''}</div>`
      : '';

    // Items
    const itemsHtml = day.items?.length
      ? `<ul class="items">${day.items.map((item) => {
          if (item.type === 'place') {
            const p = places.find((pl) => pl.id === item.id);
            if (!p) return '';
            const typeLbl = TYPE_LABELS[p.type]?.[lang] ?? p.type;
            const statusLbl = STATUS_LABELS[p.status]?.[lang] ?? '';
            const strike = p.status === 'abandoned' ? ' style="text-decoration:line-through;opacity:0.5"' : '';
            return `<li${strike}><span class="item-type">${esc(typeLbl)}</span> ${esc(p.name)}`
              + (p.region ? ` <span class="region-tag">${esc(p.region)}</span>` : '')
              + (statusLbl ? ` <span class="status-tag">${esc(statusLbl)}</span>` : '')
              + `</li>`;
          }
          return `<li>${esc(item.value)}</li>`;
        }).filter(Boolean).join('')}</ul>`
      : '';

    // Notes
    const notesHtml = day.notes
      ? `<div class="notes">${esc(day.notes)}</div>`
      : '';

    const regionHtml = day.region
      ? `<span class="day-region">${esc(day.region)}</span>`
      : '';

    return `
      <div class="day-card">
        <div class="day-header">
          <span class="day-num">${isHe ? 'יום' : 'Day'} ${idx + 1}</span>
          <span class="day-date">${esc(formatDate(day.date, lang))}</span>
          ${regionHtml}
        </div>
        ${transportHtml}${accomHtml}${itemsHtml}${notesHtml}
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${esc(tripName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isHe ? "'Heebo', 'Arial Hebrew', Arial" : 'Arial'}, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      padding: 18mm 15mm;
      direction: ${dir};
    }
    h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; }
    .subtitle {
      font-size: 10pt; color: #666; margin-bottom: 18px;
      border-bottom: 2px solid #1a1a1a; padding-bottom: 10px;
    }
    .day-card {
      margin-bottom: 14px; padding: 10px 14px;
      border: 1px solid #ddd; border-radius: 6px;
      page-break-inside: avoid;
      border-inline-start: 4px solid #c8a24b;
    }
    .day-header {
      display: flex; align-items: baseline; gap: 10px;
      flex-wrap: wrap; margin-bottom: 6px;
    }
    .day-num { font-weight: 700; font-size: 12pt; color: #c8a24b; }
    .day-date { font-size: 10pt; color: #444; }
    .day-region {
      font-size: 9pt; color: #888; background: #f5f0e8;
      padding: 1px 7px; border-radius: 10px;
    }
    .transport-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 5px; }
    .transport-chip {
      font-size: 9pt; background: #f0f0f0;
      padding: 2px 8px; border-radius: 10px; color: #444;
    }
    .accom { font-size: 10pt; color: #333; margin-bottom: 5px; }
    .cancel-tag { font-size: 8.5pt; color: #888; margin-inline-start: 5px; }
    .items { padding-inline-start: 16px; margin-bottom: 4px; }
    .items li { font-size: 10pt; color: #222; margin-bottom: 2px; line-height: 1.45; }
    .item-type {
      font-size: 8pt; color: #888; background: #f5f5f5;
      padding: 1px 4px; border-radius: 3px; margin-inline-end: 3px;
    }
    .region-tag { font-size: 8pt; color: #c8a24b; margin-inline-start: 3px; }
    .status-tag { font-size: 8pt; color: #aaa; margin-inline-start: 3px; }
    .notes { font-size: 9pt; color: #666; margin-top: 5px; font-style: italic; white-space: pre-wrap; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm 10mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <h1>${esc(tripName)}</h1>
  <div class="subtitle">${sortedDays.length} ${isHe ? 'ימים' : 'days'}</div>
  ${daysHtml}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}
