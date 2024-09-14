import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';

import { Logger } from '@shared';
import deDE from '../../translations/de-DE.json';
import enUS from '../../translations/en-US.json';
import esES from '../../translations/es-ES.json';
import frFR from '../../translations/fr-FR.json';
import ptBR from '../../translations/pt-BR.json';
import taIN from '../../translations/ta-IN.json';
import mrIN from '../../translations/mr-IN.json';
import knIN from '../../translations/kn-IN.json';
import hiIN from '../../translations/hi-IN.json';
const log = new Logger('I18nService');
const languageKey = 'language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  defaultLanguage!: string;
  supportedLanguages!: string[];
  orgLanguages!: any;
  groupDetails!: string;

  private langChangeSubject = new Subject<string>();
  langChange$ = this.langChangeSubject.asObservable();

  private langChangeSubscription!: Subscription;

  constructor(private translateService: TranslateService) {
    // Embed languages to avoid extra HTTP requests
    translateService.setTranslation('Deutsch', deDE);
    translateService.setTranslation('English', enUS);
    translateService.setTranslation('Española', esES);
    translateService.setTranslation('Français', frFR);
    translateService.setTranslation('Português', ptBR);
    translateService.setTranslation('मराठी', mrIN);
    translateService.setTranslation('தமிழ்', taIN);
    translateService.setTranslation('हिंदी', hiIN);
    translateService.setTranslation('ಕನ್ನಡ', knIN);
  }

  /**
   * Initializes i18n for the application.
   * Loads language from local storage if present, or sets default language.
   * @param defaultLanguage The default language to use.
   * @param supportedLanguages The list of supported languages.
   * @param orgLanguages The list of supported languages based on group
   */
  init(defaultLanguage: string, supportedLanguages: string[], orgLanguages: object) {
    this.defaultLanguage = defaultLanguage;
    this.supportedLanguages = supportedLanguages;
    this.language = '';
    this.orgLanguages = orgLanguages;

    // Warning: this subscription will always be alive for the app's lifetime
    this.langChangeSubscription = this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      localStorage.setItem(languageKey, event.lang);
      this.langChangeSubject.next(event.lang);
    });
  }

  /**
   * Cleans up language change subscription.
   */
  destroy() {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  /**
   * Sets the current language.
   * Note: The current language is saved to the local storage.
   * If no parameter is specified, the language is loaded from local storage (if present).
   * @param language The IETF language code to set.
   */
  set language(language: string) {
    let newLanguage =
      language || localStorage.getItem(languageKey) || this.translateService.getBrowserCultureLang() || '';
    let isSupportedLanguage = this.supportedLanguages.includes(newLanguage);

    // If no exact match is found, search without the region
    if (newLanguage && !isSupportedLanguage) {
      newLanguage = newLanguage.split('-')[0];
      newLanguage =
        this.supportedLanguages.find((supportedLanguage) => supportedLanguage.startsWith(newLanguage)) || '';
      isSupportedLanguage = Boolean(newLanguage);
    }

    // Fallback if language is not supported
    if (!newLanguage || !isSupportedLanguage) {
      newLanguage = this.defaultLanguage;
    }

    language = newLanguage;

    log.debug(`Language set to ${language}`);
    this.translateService.use(language);
  }

  /**
   * Gets the current language.
   * @return The current language code.
   */
  get language(): string {
    return this.translateService.currentLang;
  }

  /**
   * Gets the languages based on group details.
   * @param groupDetails The group details to determine the languages.
   * @return The array of languages including English as the default.
   */
  getLanguagesByGroup(orgName: string): string[] {
    let languages: string[] = ['English'];

    if (orgName) {
      const groupLanguages = this.orgLanguages[orgName];
      if (groupLanguages) {
        languages = languages.concat(groupLanguages);
      }
      if (!groupLanguages) {
        log.debug(`Language reset to ${this.defaultLanguage}`);
        this.translateService.use(this.defaultLanguage);
      }
    }

    return languages;
  }
}
