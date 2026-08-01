import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

const FAQ_HE = [
  {
    q: 'איך יוצרים טיול חדש?',
    a: 'בחר ״החלף טיול״ (סמל הגלובוס בסרגל הניווט) ← הקלד שם ← לחץ ״צור״.',
  },
  {
    q: 'איך מוסיפים מקום לרשימה?',
    a: 'עבור לטאב ״מקומות״ ← לחץ ״+ הוסף מקום״ ← מלא שם, סוג, סטטוס ואיזור. ניתן גם לצרף קישור Google Maps לאיכון אוטומטי.',
  },
  {
    q: 'איך מקשרים מקום ל-Google Maps?',
    a: 'בעריכת מקום, הדבק קישור Google Maps בשדה ״כישור / מיקום״. האפליקציה תחלץ שם וקואורדינטות אוטומטית. לחלופין, חפש לפי שם בלחיצה על סמל הזכוכית מגדלת.',
  },
  {
    q: 'איך מחשבון המרחקים עובד?',
    a: 'עבור לטאב ״מחשבון״ ← הוסף מקורות ויעדים ← לחץ ״חשב״. המחשבון מציג זמן נסיעה ומרחק בין כל צמד. ניתן לסנן לפי איזור.',
  },
  {
    q: 'מה ההבדל בין עורך לאורח?',
    a: 'עורך יכול להוסיף, לערוך ולמחוק ימים ומקומות. אורח רואה את המסלול בלבד ואינו יכול לבצע שינויים.',
  },
  {
    q: 'איך משתפים טיול?',
    a: 'ברשימת הטיולים, רחף מעל טיול ← לחץ על סמל השיתוף ← בחר ״שתף כעורך״ או ״שתף כאורח״. הקישור יועתק ללוח — שלח לנמען.',
  },
  {
    q: 'איך ניתן לראות את סדר הביקורים האופטימלי ביום?',
    a: 'בטאב ״מסלול״, לחץ על סמל המסלול (⊙) בכרטיס היום. הפאנל מציג סדר ביקור מינימלי, זמני נסיעה ומפה. עד 8 עצירות — אלגוריתם מדויק; מעל 8 — קירוב עם 2-opt.',
  },
  {
    q: 'מה זה ״ביטול חינם״ ואיך עוקבים אחריו?',
    a: 'הגדר תאריך ביטול חינם בעריכת לינה (מלון). הכרטיסייה תציג badge צבעוני: ירוק = בטוח, צהוב = קרוב, אדום = דחוף. ניתן לשנות סף ימים בהגדרות.',
  },
  {
    q: 'איך מחליפים ימים במסלול?',
    a: 'גרור את סמל הגריד (⠿) בפינת כרטיס היום ושחרר מעל יום אחר — תכני הימים יתחלפו, התאריכים יישארו.',
  },
  {
    q: 'האם הנתונים מסונכרנים בין מכשירים?',
    a: 'כן. כל הנתונים נשמרים ב-Firestore בענן ומסונכרנים בזמן אמת לכל משתמש עם גישה לאותו טיול.',
  },
];

const FAQ_EN = [
  {
    q: 'How do I create a new trip?',
    a: 'Tap the globe icon in the header → type a name → press "Create".',
  },
  {
    q: 'How do I add a place?',
    a: 'Open the "Places" tab → click "+ Add place" → fill in name, type, status and region. Paste a Google Maps link for automatic geocoding.',
  },
  {
    q: 'How do I link a place to Google Maps?',
    a: 'In the place editor, paste a Google Maps URL into the Link/Location field. The app extracts the name and coordinates automatically. Alternatively use the magnifier to search by name.',
  },
  {
    q: 'How does the distance calculator work?',
    a: 'Open the "Calculator" tab → add origins and destinations → click "Calculate". The calculator shows travel time and distance for each pair. You can filter by region.',
  },
  {
    q: 'What is the difference between editor and guest?',
    a: 'An editor can add, edit and delete days and places. A guest can only view the itinerary.',
  },
  {
    q: 'How do I share a trip?',
    a: 'In the trips list, hover over a trip → click the share icon → choose "Share as editor" or "Share as guest". The link is copied to your clipboard.',
  },
  {
    q: 'How does the optimal route work?',
    a: 'In the Itinerary tab, click the route icon on a day card. For up to 8 stops, an exact TSP algorithm is used; beyond 8, a nearest-neighbour + 2-opt heuristic is applied.',
  },
  {
    q: 'What is free cancellation tracking?',
    a: 'Set a free-cancellation date on a hotel. The card badge turns green (safe), amber (soon) or red (urgent). Thresholds are configurable in Settings.',
  },
  {
    q: 'How do I swap days in the itinerary?',
    a: 'Drag the grid handle (⠿) on a day card and drop it onto another day — the contents swap while dates stay fixed.',
  },
  {
    q: 'Is my data synced across devices?',
    a: 'Yes. All data is stored in Firestore and synced in real-time to every user with access to the trip.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--c-border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 py-3 text-start"
        style={{ color: 'var(--c-ink)' }}
      >
        <span className="text-sm font-medium leading-snug">{q}</span>
        <ChevronDown
          size={15}
          style={{
            color: 'var(--c-muted)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
          }}
        />
      </button>
      {open && (
        <p className="pb-3 text-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FaqModal({ language, onClose }) {
  const isHe = language === 'he';
  const items = isHe ? FAQ_HE : FAQ_EN;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 shrink-0"
          style={{ borderBottom: '1px solid var(--c-border)' }}
        >
          <h3 className="font-bold text-lg" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-display)' }}>
            {isHe ? 'שאלות נפוצות' : 'FAQ'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--c-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto px-4 pb-4">
          {items.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>
      </div>
    </div>
  );
}
