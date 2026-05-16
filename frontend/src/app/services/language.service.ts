import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEY = 'castilfac_lang';

export type AppLanguage = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly supportedLangs: readonly AppLanguage[] = ['es', 'en'];

  async init(): Promise<void> {
    this.translate.addLangs([...this.supportedLangs]);
    this.translate.setFallbackLang('es');

    const saved = this.getSavedLang();
    const browser = this.translate.getBrowserLang();
    const lang: AppLanguage =
      saved ?? (browser?.startsWith('en') ? 'en' : 'es');

    await firstValueFrom(this.translate.use(lang));
    this.applyDocumentLang(lang);
  }

  get currentLang(): AppLanguage {
    const lang = this.translate.getCurrentLang();
    return lang === 'en' ? 'en' : 'es';
  }

  async setLanguage(lang: AppLanguage): Promise<void> {
    await firstValueFrom(this.translate.use(lang));
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    this.applyDocumentLang(lang);
  }

  private getSavedLang(): AppLanguage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'en' || value === 'es' ? value : null;
  }

  private applyDocumentLang(lang: AppLanguage): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.lang = lang;
    }
  }
}
