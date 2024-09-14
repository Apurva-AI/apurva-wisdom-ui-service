import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { environment } from '@env/environment';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonService } from '@app/services/common-service.service';
import { AuthenticationService } from '@app/auth';
import { LANGUAGE_MAP } from 'src/utils';
import { I18nService } from '@app/i18n';
import { v4 as uuidv4 } from 'uuid';
import * as marked from 'marked';
@Component({
  selector: 'app-enhance',
  templateUrl: './enhance.component.html',
  styleUrls: ['./enhance.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })), // Initial state when element is not present in the DOM
      state('*', style({ opacity: 1 })), // Default state for when element is present in the DOM
      transition('void <=> *', animate('500ms ease-in-out')), // Transition between void and any state
    ]),
  ],
})
export class EnhanceComponent implements OnInit {
  @Output() enhanceEvent = new EventEmitter<string>();
  enhanceResponses: any;
  selectedArr: any;
  enhanceResponsesArr: any[] = [];
  enhanceTranslateResponses: any;
  enhanceResult: boolean = false;
  enhanceTranslate: boolean = false;
  enhanceTranslateReady: boolean = false;
  enhanceTranslateUsed: boolean = false;
  @Input() concatenatedIds!: string;
  @Input() enhanceToggle!: boolean;
  @Input() viewResults!: boolean;
  @Input() viewEnhance!: boolean;
  @Input() checkedIDs: string[] = [];
  partialAnswers: string[] = [];
  private subscription!: Subscription;
  prompt!: string;
  keyword!: string;
  language!: any;
  user_name!: string;
  customText: string = '';
  sendDisabled: boolean = false;
  selectedItem: any;
  constructor(
    private apiService: CommonService,
    private auth: AuthenticationService,
    private languageService: I18nService
  ) {
    let details: any = auth.getLoggedUser();
    this.user_name = details.preferred_username;
  }
  // ideasArray:any;
  ideasArray!: { sectionName: string; items: { keyword: any; prompts: any }[] }[];
  isAnswer = false;
  ngOnInit(): void {
    this.ideasArray = this.formatData(this.apiService.promptsArr);
    const orgId = this.apiService.groupDetailsStr;
    const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
    if (orgIdExists) {
      this.enhanceTranslate = true;
      this.language = LANGUAGE_MAP[this.languageService.language];
      this.languageService.langChange$.subscribe((language) => {
        this.language = LANGUAGE_MAP[language];
        if (this.enhanceResult && this.enhanceTranslate) {
          // If already showing enhance result and translation is enabled, re-translate
          this.translateEnhance(this.enhanceResponses);
        }
      });
    } else {
      this.language = 'en';
    }
  }
  async showAnswer(prompt: string, keyword: string) {
    this.prompt = prompt;
    this.keyword = keyword;
    const uuid = uuidv4();
    this.enhanceResponsesArr.push({
      uuid: uuid,
      index: this.enhanceResponsesArr.length,
      prompt: prompt,
      keyword: keyword,
      answer: '',
      translateEnhance: false,
      translatedAnswer: '',
      rawResponse: '',
    });
    this.goToPage(uuid);
    let interactData = {
      type: 'CLICK',
      subtype: 'enhance-prompts',
      id: this.keyword,
      extra: {
        pos: [{}],
        values: [],
        tid: '',
        uri: '',
      },
    };
    this.enhanceResult = true;
    let responseTrigger: Boolean = false;
    let apiRequest = this.apiService.getEnhance(this.concatenatedIds, prompt);
    apiRequest.subscribe(
      async (data: any) => {
        if (data.partialText || data.body) {
          if (data.partialText) {
            if (data.partialText != '' && data?.partialText.length > 5) {
              const enhanceArr = this.enhanceResponsesArr.find((item: { uuid: string }) => item.uuid === uuid);
              if (enhanceArr) {
                enhanceArr.answer = await this.markDownFormat(data.partialText);
                enhanceArr.rawResponse = data.partialText;
              }
            }
          }
          if (data.body) {
            if (!responseTrigger) {
              responseTrigger = true;
            }
            const enhanceArr = this.enhanceResponsesArr.find((item: { uuid: string }) => item.uuid === uuid);
            if (enhanceArr) {
              enhanceArr.answer = await this.markDownFormat(data.body);
            }

            let obj = {
              questionText: this.keyword,
              questionSource: 'ENHANCE',
              answerText: { answer: data.body },
              referenceDocIds: this.checkedIDs,
            };
            this.triggerTelemetryEvents(obj, interactData);
            if (this.enhanceTranslate && this.language !== 'en') {
              this.translateEnhance(uuid);
            }
          }
        }
      },
      (error: any) => {
        console.error('API request error:', error);
        const errorMessage =
          'Something went wrong. Please verify the result selection and try again with a different question';
        const enhanceArr = this.enhanceResponsesArr.find((item: { uuid: string }) => item.uuid === uuid);
        if (enhanceArr) {
          enhanceArr.answer = errorMessage;
          enhanceArr.translatedAnswer = errorMessage;
        }
      }
    );
  }

  replaceLineBreaks(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  formatData(data: any) {
    const transformedData: { sectionName: string; items: { keyword: any; prompts: any }[] }[] = [];

    data?.forEach((item: { section_name: any; keyword: any; prompts: any }) => {
      const sectionName = item.section_name;
      const keyword = item.keyword;
      const prompts = item.prompts;

      const existingSection = transformedData.find(
        (section: { sectionName: any }) => section.sectionName === sectionName
      );

      if (!existingSection) {
        transformedData.push({
          sectionName,
          items: [{ keyword, prompts }],
        });
      } else {
        existingSection.items.push({ keyword, prompts });
      }
    });

    return transformedData;
  }

  translateEnhance(uuid: string) {
    this.enhanceTranslateUsed = true;
    const enhanceArr = this.enhanceResponsesArr.find((item: { uuid: string }) => item.uuid === uuid);
    if (enhanceArr && enhanceArr.rawResponse) {
      this.apiService.translateText(enhanceArr.rawResponse, 'en', this.language).subscribe(
        async (response: any) => {
          enhanceArr.translatedAnswer = await this.markDownFormat(response.payload?.data);
          enhanceArr.translateEnhance = true;
        },
        (error) => {
          console.log(error);
          const errorMessage = "Sorry, we couldn't translate";
          enhanceArr.translatedAnswer = errorMessage;
        }
      );
    }
  }

  async markDownFormat(markdownText: string): Promise<string> {
    let html = marked.parse(markdownText);
    return html;
  }

  onInputChange(inputValue: any) {
    // Check if the input value is not empty
    if (inputValue && inputValue.trim() !== '') {
      this.sendDisabled = true;
    } else {
      this.sendDisabled = false; // Disable the "Send" button
    }
  }

  goToPage(page: string | number) {
    if (typeof page === 'string') {
      if (page === 'first') {
        this.selectedArr = this.enhanceResponsesArr[0].uuid;
      } else if (page === 'last') {
        this.selectedArr = this.enhanceResponsesArr[this.enhanceResponsesArr.length - 1].uuid;
      } else if (page === 'prev') {
        const currentIndex = this.enhanceResponsesArr.findIndex((enhance) => enhance.uuid === this.selectedArr);
        if (currentIndex > 0) {
          this.selectedArr = this.enhanceResponsesArr[currentIndex - 1].uuid;
        }
      } else if (page === 'next') {
        const currentIndex = this.enhanceResponsesArr.findIndex((enhance) => enhance.uuid === this.selectedArr);
        if (currentIndex < this.enhanceResponsesArr.length - 1) {
          this.selectedArr = this.enhanceResponsesArr[currentIndex + 1].uuid;
        }
      } else {
        // handle specific UUID case
        this.selectedArr = page;
      }
    } else {
      this.selectedArr = page;
    }
    this.updateSelectedItem(); // Make sure the selected item is updated
  }

  updateSelectedItem() {
    this.selectedItem = this.enhanceResponsesArr.find((enhance) => enhance.uuid === this.selectedArr);
  }

  triggerTelemetryEvents(responseDetails: any, interactData: any) {
    this.apiService.initTelemetry();
    this.apiService.response(responseDetails);
    this.apiService.interact(interactData);
  }
}
