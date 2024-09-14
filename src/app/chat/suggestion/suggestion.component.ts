import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonService } from '@app/services/common-service.service';
import { Subscription } from 'rxjs';
import { LANGUAGE_MAP } from 'src/utils';
import { I18nService } from '@app/i18n';

@Component({
  selector: 'app-suggestion',
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.scss'],
})
export class SuggestionComponent implements OnInit {
  @Input() token: any;
  @Input() sendDisabled: any;
  @Output() quesEvent = new EventEmitter<string>();
  localToken: any;
  suggestedQuestions: any = [];
  suggestedQuestionsres: any = [];
  subscription: Subscription;
  suggToken: any;
  language!: any;

  constructor(private apiService: CommonService, private languageService: I18nService) {
    this.subscription = this.apiService.triggerSuggestion$.subscribe((token) => {
      // Call your function here using the received token
      this.changeToken(token);
    });
    this.subscription = this.apiService.triggerFunction$.subscribe(() => {
      this.clearArr();
    });
  }

  ngOnInit(): void {}

  ngOnChanges() {}

  async changeToken(token: any) {
    this.language = LANGUAGE_MAP[this.languageService.language];

    this.suggestedQuestionsres = await this.suggestedCall(token);
    if (this.suggestedQuestionsres[0] !== '') {
      this.suggestedQuestions = this.suggestedQuestionsres;
      if (this.language !== 'en') {
        this.suggestedQuestions = await this.apiService.translateSuggestions(this.suggestedQuestions);
      }
    } else {
      this.suggestedQuestions = [];
    }
  }

  async suggestedCall(token: any) {
    let resultsVar = await this.apiService
      .getSuggestions(token)
      .toPromise()
      .then((res) => {
        return res;
      })
      .catch((error) => {
        console.log('Results API has failed');
      });

    return resultsVar;
  }

  async sendQues(ques: any) {
    this.quesEvent.emit(ques);
  }

  clearArr() {
    this.suggestedQuestions = [];
    this.suggestedQuestionsres = [];
  }
}
