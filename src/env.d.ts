/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_POCKETBASE_URL?: string;
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_RATE_LIMIT_WINDOW_MS?: string;
  readonly CONTACT_RATE_LIMIT_MAX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    locale: import('./lib/locale').Locale;
    labels: import('./lib/i18n').Labels;
    navLinks: import('./lib/types').NavLink[];
    cmsAvailable: boolean;
    settings?: import('./lib/types').SiteSettings;
  }
}
