import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonService } from '@app/services/common-service.service';
import { environment } from '@env/environment';
import { AuthenticationService } from 'src/app/auth/authentication.service';
import { predefinedColors } from './color-config';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { EnhanceComponent } from '../enhance/enhance.component';
@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })), // Initial state when element is not present in the DOM
      state('*', style({ opacity: 1 })), // Default state for when element is present in the DOM
      transition('void <=> *', animate('500ms ease-in-out')), // Transition between void and any state
    ]),
  ],
})
export class ResponseComponent implements OnInit {
  @ViewChild('enhanceRef', { static: false }) enhanceComponent!: EnhanceComponent;
  @Output() reactionEvent = new EventEmitter<object>();
  @Output() scrollEvent = new EventEmitter();
  @Input() resAnswer!: any;
  @Input() resResultArr!: any;
  @Input() responseId!: string;
  @Input() isCommonPhrase!: boolean;
  @Input() queryQuestion!: any;
  @Input() querySource!: any;
  @Input() isLanguageMismatch: boolean = false;
  @Input() translationError: boolean = false;
  @Input() viewResults!: boolean;
  @Input() viewEnhance!: boolean;
  @Input() detectedLanguageCode!: string;
  @Input() quesToken!: string;
  @Input() resToken!: string;
  @Input() feedbackReaction!: string;
  enhanceResult: boolean = false;
  coordinator_id: string;
  predefinedColors: string[] = predefinedColors;
  isResultDataLoaded: boolean = false;
  responseIdParent!: string;
  resResultArrParent: any[] = [];
  answerLinks: any[] = [];
  responseFooterVisible: boolean = false;
  teleAnswer: any;
  enhanceToggle: boolean = false;
  checkedIDs: string[] = [];
  resOrgId!: any[];
  channelData: any[] = [];
  concatenatedIds!: string;
  enhanceResponses!: Observable<any>;
  enhanceEvent!: string;
  resultsAvailable: boolean = false;
  data: any[] = [];
  responseLoaded: boolean = false;

  constructor(private apiService: CommonService, private auth: AuthenticationService) {
    let details: any = auth.getLoggedUser();
    this.coordinator_id = details.sub;
    this.channelData = this.apiService.getGroupsArr();
  }

  ngOnInit(): void {
    this.responseIdParent = this.responseId;
    if (this.resToken != this.resResultArr) {
      this.data = JSON.parse(this.resResultArr);
      this.processResponseData(this.resResultArr);
      this.isResultDataLoaded = true;
    }

    this.apiService.getAnswerEvent().subscribe(async (token: string) => {
      if (token == this.resResultArr) {
        this.data = await this.resultsCall(token);
        this.isResultDataLoaded = true;
        this.processResponseData(this.data);
        if (this.data !== null) {
          this.resOrgId = this.getUniqueChannels(this.data);
          this.responseFooterVisible = true;
          let obj = {
            questionText: this.queryQuestion,
            questionSource: this.querySource,
            answerText: { answer: this.teleAnswer, result: JSON.stringify(this.data) },
            id: this.coordinator_id,
            token: this.resResultArr,
          };
          this.apiService.createTelemetryEvent(obj);
        }
      }
    });
  }
  ngAfterViewInit() {}

  onAnswerLoaded() {
    this.responseLoaded = true;
  }

  async resultsCall(token: any) {
    try {
      let resultsVar = await this.apiService.getResults(token).toPromise();
      if (resultsVar) {
        resultsVar.forEach((data: any) => {
          data.question_id = token;
          data.isObservable = true;
        });

        setTimeout(() => {
          this.apiService.triggerSuggestion(token);
        }, 15000);
      }
      return resultsVar;
    } catch (error) {
      console.log('Results API has failed');
    }
  }

  private processResponseData(data: any): void {
    this.resultsAvailable = this.data.length > 0;

    if (this.data !== null) {
      this.resResultArrParent = this.data;
      this.resResultArrParent.forEach((item) => {
        item.isVisible = false;
        item.isUsedEnhance = true;
      });
      this.resOrgId = this.getUniqueChannels(this.data);
      this.responseFooterVisible = true;
    }
  }

  getUniqueChannels(resResultArr: any[]): any[] {
    let channels: any[] = [];
    if (resResultArr && Array.isArray(resResultArr)) {
      resResultArr.forEach((item) => {
        item.tags.forEach((channel: string) => {
          const channelObj = this.channelData.find((c) => c.name === channel);
          const filtersObject = {};
          if (channelObj) {
            filtersObject[channelObj.name] = true;
            channels.push({
              channel: channelObj.name,
              color: channelObj.color,
              filters: filtersObject,
              question_id: item.question_id,
              translated_channel: null,
              id: uuidv4(),
            });
          } else {
            filtersObject[channel] = true;
            channels.push({
              channel: channel,
              color: '#8492bd',
              filters: filtersObject,
              question_id: item.question_id,
              translated_channel: null,
              id: uuidv4(),
            });
          }
        });
      });
    }

    const uniqueChannels = channels.filter((value, index, self) => {
      return self.findIndex((item) => item.channel === value.channel) === index;
    });
    return uniqueChannels;
  }

  callevent($event: any) {
    this.reactionEvent.emit($event);
  }

  addAnswer($event: [string, Array<any>]) {
    this.teleAnswer = $event[0];
    this.answerLinks = $event[1];
  }

  updateCheckedIDs(checkedIDs$: string[]): void {
    this.concatenatedIds = '';
    this.checkedIDs = checkedIDs$;
    this.concatenatedIds = this.concatenateIDs(this.checkedIDs);
  }
  enhanceToggleFunction() {
    this.scrollEvent.emit();
    if (!this.enhanceComponent.enhanceResponses) {
      this.enhanceToggle = !this.enhanceToggle;
    } else {
      this.enhanceComponent.enhanceResult = false;
      this.enhanceComponent.enhanceResponses = '';
      this.enhanceComponent.enhanceTranslateUsed = false;
      this.enhanceComponent.enhanceTranslateResponses = '';
      this.enhanceComponent.enhanceTranslateReady = false;
      this.enhanceComponent.prompt = '';
      this.enhanceComponent.customText = '';
      this.enhanceComponent.sendDisabled = false;
    }
  }

  enhanceCall($event: any) {
    this.enhanceResponses = this.apiService.getEnhance(this.concatenatedIds, $event);
  }

  concatenateIDs(ids: string[]): string {
    const sortedIds = ids.slice().sort();
    const concatenatedString = sortedIds.join('.');
    return concatenatedString;
  }
}
