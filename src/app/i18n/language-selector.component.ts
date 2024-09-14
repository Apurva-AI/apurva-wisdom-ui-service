import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from '@app/services/common-service.service';

import { I18nService } from './i18n.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
})
export class LanguageSelectorComponent implements OnInit {
  @Input() inNavbar = false;
  @Input() menuClass = '';
  languages!: string[];

  constructor(private i18nService: I18nService, private apiService: CommonService) {}

  ngOnInit() {
    this.setLanguagesBasedOnGroup();
  }

  setLanguage(language: string) {
    this.i18nService.language = language;
    this.apiService.translateChannelData();
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  setLanguagesBasedOnGroup() {
    const groupName = this.apiService.groupName;
    this.languages = this.i18nService.getLanguagesByGroup(groupName);
  }
}
