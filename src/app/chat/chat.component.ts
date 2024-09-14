import { Component, OnInit, Output, EventEmitter, ViewChild, Input, ElementRef } from '@angular/core';
import { AuthenticationService } from 'src/app/auth/authentication.service';
import { CommonService } from '@app/services/common-service.service';
import { FooterComponent } from '@app/chat/footer/footer.component';
import { v4 as uuidv4 } from 'uuid';
import { Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { I18nService } from '@app/i18n/i18n.service';
import { LANGUAGE_MAP } from 'src/utils';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  groupDetails: string = '';
  coordinator_id: any = '';
  user_name: any = '';
  resultsVar: any;
  answersVar: any;
  responseArray: any = [];
  show = true;
  token!: string;
  question!: any;
  timeoutId: any;
  timeoutReached: boolean = false;
  subscription: Subscription;
  isLanguageMismatch: boolean = false;
  detectedLanguageCode: any;
  language: any;
  delayInSeconds = 2;
  translationError: boolean = false;
  viewResults: boolean = true;
  viewEnhance: boolean = true;
  isMobile: boolean = false;
  currentScreenSize: any;
  questionText: any;
  sessionId: any;
  oldSessionData: any[] = [];
  query: string = '';
  querySource: string = '';
  quesToken: string = '';
  resToken: string = '';
  offset: number = 0;
  limit: number = 5;
  totalCount: number = 0;
  private destroy$ = new Subject<void>();
  networkQuestions: string[] = [];
  isSpinning: boolean = false;
  isNewSession: any;
  isLoadMoreVisible: boolean = false;

  toggleShow() {
    this.show = !this.show;
  }

  @ViewChild('footerRef', { static: false }) footerComponent!: FooterComponent;
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
  @Input() resQuestion!: string;
  @Output() tokenEvent = new EventEmitter<string>();

  constructor(
    private auth: AuthenticationService,
    private apiService: CommonService,
    private languageService: I18nService,
    private breakpointObserver: BreakpointObserver,
    private route: ActivatedRoute
  ) {
    this.subscription = this.apiService.triggerFunction$.subscribe(() => {
      this.clearArr();
    });
    let details: any = auth.getLoggedUser();
    this.coordinator_id = details.sub;
    this.user_name = details.preferred_username;
  }
  ngOnInit(): void {
    this.groupDetails = this.apiService.groupDetailsStr;
    // Subscribe to route parameters
    this.route.params.subscribe((params) => {
      const sessionId = params['sessionId'];
      this.isNewSession = this.apiService.getIsNewSession();
      // Check if it's a new session
      if (this.isNewSession) {
        this.getNetworkQuestions();
      }
      this.sessionId = sessionId || this.apiService.getSessionID(); // Use the generated session ID if sessionId is undefined
      this.handleSessionChange();
    });
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result.matches) {
          if (result.breakpoints[Breakpoints.XSmall]) {
            this.currentScreenSize = 'XSmall';
            this.viewResults = false;
            this.viewEnhance = false;
            this.isMobile = true;
          } else if (result.breakpoints[Breakpoints.Small]) {
            this.currentScreenSize = 'Small';
            this.viewResults = false;
            this.viewEnhance = false;
            this.isMobile = true;
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.currentScreenSize = 'Medium';
            this.viewResults = true;
            this.viewEnhance = true;
            this.isMobile = false;
          } else if (result.breakpoints[Breakpoints.Large]) {
            this.currentScreenSize = 'Large';
            this.viewResults = true;
            this.viewEnhance = true;
            this.isMobile = false;
          } else if (result.breakpoints[Breakpoints.XLarge]) {
            this.currentScreenSize = 'XLarge';
            this.viewResults = true;
            this.viewEnhance = true;
            this.isMobile = false;
          }
        }
      });
  }

  private handleSessionChange(): void {
    this.resetSessionData(); // Reset session data
    if (this.isNewSession) {
      this.apiService.setIsNewSession(false); // Reset the flag after processing
    } else {
      this.loadEntries(this.sessionId);
      this.apiService.setSessionID(this.sessionId);
    }
  }

  private resetSessionData(): void {
    this.responseArray = [];
    this.oldSessionData = [];
    this.offset = 0;
    this.isLoadMoreVisible = false; // Reset "Load More" visibility
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  clearArr() {
    this.responseArray = [];
    this.footerComponent.onSendRecieve();

    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEntries(sessionId: any) {
    this.apiService.getSessionDetails(sessionId, this.offset, this.limit).subscribe(
      (response) => {
        this.oldSessionData = response.data;
        this.totalCount = response.totalCount;
        this.oldSessionData.forEach((session) => {
          const uuid = uuidv4();
          this.responseArray.push({
            uuid: uuid,
            question: session.question_text,
            answersVar: session.answer_text,
            resultsVar: session.result,
            reaction: session.reaction,
            sessionId: session.sid,
          });
        });
        this.isLoadMoreVisible = this.responseArray.length < this.totalCount;
      },
      (error) => {
        console.error('Error fetching unique sessions:', error);
      }
    );
  }

  loadMore() {
    if (this.isLoadMoreVisible) {
      this.offset += this.limit;
      this.loadEntries(this.sessionId);
    }
  }

  showLoadMoreButton(): boolean {
    return this.isLoadMoreVisible;
  }

  onRefreshClicked() {
    this.getNetworkQuestions();
  }

  async receiveMessage($event: any) {
    this.question = $event;
    this.query = this.question.ques;
    this.querySource = this.question.source;
    this.detectedLanguageCode = this.question.detectedLanguage;
    const userId = this.user_name;
    const orgId = this.groupDetails;
    const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
    if (orgIdExists) {
      this.language = LANGUAGE_MAP[this.languageService.language];
    } else {
      this.language = 'en';
    }

    const uuid = uuidv4();
    this.responseArray.push({
      uuid: uuid,
      question: this.query,
      resultsVar: null,
      answersVar: null,
      reaction: null,
      isCommonPhrase: false,
      sessionId: null,
    });
    if (this.language === this.detectedLanguageCode || this.detectedLanguageCode === 'en') {
      if (this.language === 'en' || this.detectedLanguageCode === 'en') {
        this.questionText = this.query;
        // Language is already English, no need for translation, proceed directly
        this.scrollToBottom();
        this.apiService.makeCraftAPICall(this.query, userId, orgId, this.sessionId).subscribe(
          async (response: any) => {
            this.quesToken = response.token;
            this.resToken = response.token;
            const session_id = response.session_id;
            this.updateResponseArray(uuid, this.quesToken, false, session_id);
          },
          (error) => {
            console.log('Craft API error:', error);
            this.timeout(uuid);
            this.footerComponent.onSendRecieve();
          }
        );
      } else {
        // Language is not English, perform translation and then make the API call
        this.apiService
          .translateText(this.query, this.detectedLanguageCode, 'en')
          .pipe(
            switchMap((response: any) => {
              const translatedQuestion = response.payload.data;
              this.scrollToBottom();
              const requestQuestion = this.detectedLanguageCode == 'en' ? this.query : translatedQuestion;
              this.questionText = requestQuestion;
              return this.apiService.makeCraftAPICall(requestQuestion, userId, orgId, this.sessionId);
            })
          )
          .subscribe(
            (response: any) => {
              this.quesToken = response.token;
              this.resToken = response.token;
              const session_id = response.session_id;
              this.updateResponseArray(uuid, this.quesToken, true, session_id);
            },
            (error) => {
              this.translationError = true;
              // Handle other errors here
              console.error('Translation error:', error);
              this.timeout(uuid);
              this.footerComponent.onSendRecieve();
            }
          );
      }
    } else {
      this.displayLanguageMismatchError(uuid);
    }
  }

  updateResponseArray(uuid: string, token: any, falseLanguageMismatch: boolean, sessionId: string) {
    this.tokenEvent.emit(token);
    setTimeout(async () => {
      clearTimeout(this.timeoutId);
      this.resultsVar = token;
      this.answersVar = token;
      if (this.answersVar) {
        const existingQuestion = this.responseArray.find((item: { uuid: string }) => item.uuid === uuid);
        if (existingQuestion) {
          existingQuestion.answersVar = this.answersVar;
          existingQuestion.sessionId = sessionId;
        }
      }
      if (this.resultsVar) {
        const existingQuestion = this.responseArray.find((item: { uuid: string }) => item.uuid === uuid);
        if (existingQuestion) {
          existingQuestion.resultsVar = this.resultsVar;
          existingQuestion.sessionId = sessionId;
        }
      }
      if (this.answersVar && !this.timeoutReached) {
        if (falseLanguageMismatch) this.isLanguageMismatch = false;
        this.footerComponent.onSendRecieve();
        this.footerComponent.onRecieveSuggested(token);
      } else {
        this.timeout(uuid);
        console.log('We couldnt find an appropriate solution from your/public sources, Please try again later');
        this.footerComponent.onSendRecieve();
      }
    }, this.delayInSeconds * 1000);
  }

  displayLanguageMismatchError(uuid: string) {
    if (this.language !== this.detectedLanguageCode) {
      this.isLanguageMismatch = true;
      const existingQuestionElse = this.responseArray.find((item: { uuid: string }) => item.uuid === uuid);
      if (existingQuestionElse) {
        existingQuestionElse.answersVar =
          'The input question is not in alignment with the chosen language. Please pose your question in the selected language or in English.';
      }
      this.footerComponent.onSendRecieve();
    }
  }

  timeout(uuid: string) {
    this.timeoutReached = false;
    const existingQuestionElse = this.responseArray.find((item: { uuid: string }) => item.uuid === uuid);
    if (existingQuestionElse) {
      existingQuestionElse.answersVar =
        'We couldnt find an appropriate solution from your/public sources, Please try again later';
      existingQuestionElse.isCommonPhrase = true;
      existingQuestionElse.resultsVar = [];
    } else {
      console.log('error in timeout method!!!!!!!');
    }
  }

  storeReaction($event: any) {
    setTimeout(() => {
      const uuid = $event.id;
      const reaction = $event.reaction;
      const existingQuestionElse = this.responseArray.find((item: { uuid: string }) => item.uuid === uuid);
      if (existingQuestionElse) {
        existingQuestionElse.reaction = reaction;
      } else {
        console.log('error in reaction storage!!!!!!');
      }
    }, 100);
  }

  scrollEnhance(id: number) {
    if (this.responseArray.length - 1 == id) {
      this.scrollToBottom();
    }
  }

  // scrollToBottom() {
  //   setTimeout(() => {
  //     const container = this.scrollContainer.nativeElement;
  //     container.scrollTop = container.scrollHeight;
  //   }, 100);
  // }

  scrollToBottom(scrollBehavior: 'full' | 'small-gap' | 'large-gap' = 'full') {
    setTimeout(() => {
      const container = this.scrollContainer.nativeElement;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      let scrollPosition: number;

      switch (scrollBehavior) {
        case 'full':
          scrollPosition = scrollHeight;
          break;
        case 'small-gap':
        case 'large-gap':
          const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const gapInRem = scrollBehavior === 'small-gap' ? 5 : 35;
          const gapInPixels = gapInRem * rootFontSize;
          scrollPosition = scrollHeight - clientHeight - gapInPixels;
          break;
      }

      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }, 100);
  }

  getNetworkQuestions(): void {
    this.isSpinning = true;
    this.apiService.getNetworkQuestions(this.groupDetails, 4).subscribe(
      (response) => {
        this.networkQuestions = response.questions;
        this.isSpinning = false;
      },
      (error) => {
        console.error(error);
        this.isSpinning = false;
      }
    );
  }

  //Dont remove this code. Fetches network questions from database table
  // getNetworkQuestions(): void {
  //   this.apiService.getNetworkQuestions(this.groupDetails, this.user_name).subscribe(
  //     (response) => {
  //       this.questions = response.data
  //     },
  //     (error) => {
  //       console.error(error);
  //     }
  //   );
  // }

  toggleResults() {
    this.viewResults = !this.viewResults;
    if (this.viewResults && this.viewEnhance) {
      this.scrollToBottom('large-gap');
    } else if (this.viewResults && !this.viewEnhance) {
      this.scrollToBottom();
    }
  }

  toggleEnhance() {
    this.viewEnhance = !this.viewEnhance;
    if (this.viewEnhance) {
      this.scrollToBottom('small-gap');
    }
  }
}
