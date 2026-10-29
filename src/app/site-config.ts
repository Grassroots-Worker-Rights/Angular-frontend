/**
 * Central, non-translatable site settings.
 *
 * Contact details are intentionally empty for now: every place that shows them
 * (footer, About page, FAQ) hides the contact links while these are blank, and shows
 * a "coming soon" note instead. Fill them in here and they appear everywhere.
 */
export const SITE_CONFIG = {
  name: 'Εργασιακός Οδηγός Βάσης',
  siteUrl: 'https://ergasiakos-odigos.gr',
  defaultDescription:
    'Εργασιακός Οδηγός Βάσης: δωρεάν και ανώνυμος οδηγός εργασιακών δικαιωμάτων. Άρθρα, εργαλεία υπολογισμού (αποζημίωση, δώρα, άδειες, υπερωρίες) και AI βοηθός.',
  defaultOgImage: 'https://ergasiakos-odigos.gr/logo-icon.png',
  /**
   * The collectives that make the guide; each is shown on its own line in the footer.
   * Fill in `url` (e.g. 'https://example.gr') to make the name clickable; leave it '' for plain text.
   */
  organizations: [
    { name: 'Σωματείο Σερβιτόρων-Μαγείρων Θεσσαλονίκης', url: 'https://ssmthess.espivblogs.net/' },
    { name: 'Σωματείο Βάσης Εργαζομένων στον χώρο της ψυχικής υγείας & κοινωνικής πρόνοιας', url: 'https://svepsykoi.espivblogs.net/' },
    { name: 'Ταξική Πρωτοβουλία Βάσης Εργαζομένων στις Τηλεπικοινωνίες και στην Πληροφορική', url: 'https://tpv-tech.gr/' },
  ] as ReadonlyArray<{ name: string; url: string }>,
  organizationShort: 'ΤΠΒ',
  /** e.g. 'info@example.gr' */
  contactEmail: '',
  /** e.g. 'https://example.gr/contact' (contact form, social page, etc.) */
  contactUrl: '',
  /** Number of calculators registered in ToolsComponent's toolRegistry. */
  toolCount: 17,
  /** Labour Inspectorate (Επιθεώρηση Εργασίας) hotline. */
  labourInspectoratePhone: '1555',
} as const;

export const hasContactInfo = (): boolean =>
  !!(SITE_CONFIG.contactEmail || SITE_CONFIG.contactUrl);
