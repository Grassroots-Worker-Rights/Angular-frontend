/**
 * Seasonal highlight shown on the home page. Each season points to the calculator
 * that is most relevant at that time of year (opened via `/tools#<toolKey>`).
 */
export interface Season {
  /** Stable id, also the i18n sub-key under HOME.SEASONAL. */
  id: 'new-year' | 'easter' | 'summer-leave' | 'year-end-leave' | 'christmas';
  icon: string;
  /** Key in ToolsComponent's toolRegistry. */
  toolKey: string;
}

const SEASONS: Record<Season['id'], Season> = {
  'new-year': { id: 'new-year', icon: 'account_balance_wallet', toolKey: 'salary' },
  easter: { id: 'easter', icon: 'redeem', toolKey: 'easter-bonus' },
  'summer-leave': { id: 'summer-leave', icon: 'beach_access', toolKey: 'leave-pay' },
  'year-end-leave': { id: 'year-end-leave', icon: 'event_available', toolKey: 'leave-days' },
  christmas: { id: 'christmas', icon: 'card_giftcard', toolKey: 'xmas-bonus' },
};

/** Month (0 = January) → season id. */
const MONTH_TO_SEASON: Season['id'][] = [
  'new-year', 'new-year',           // Jan, Feb   — new tax year, check your payslip
  'easter', 'easter',               // Mar, Apr   — Easter bonus (paid before Easter)
  'summer-leave', 'summer-leave',   // May, Jun   — leave pay & leave allowance
  'summer-leave', 'summer-leave',   // Jul, Aug
  'year-end-leave', 'year-end-leave', // Sep, Oct — annual leave must be granted within the year
  'christmas', 'christmas',         // Nov, Dec   — Christmas bonus (paid by 21 Dec)
];

export function getSeason(date: Date = new Date()): Season {
  return SEASONS[MONTH_TO_SEASON[date.getMonth()]];
}

export function getSeasonById(id: string | null | undefined): Season | null {
  return id && id in SEASONS ? SEASONS[id as Season['id']] : null;
}
