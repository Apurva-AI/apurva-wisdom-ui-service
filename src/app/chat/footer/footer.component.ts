import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  EventEmitter,
  Output,
  HostListener,
  Input,
  AfterViewInit,
} from '@angular/core';
import { SpeechError } from '@app/modal/speech-error';
import { SpeechEvent } from '@app/modal/speech-event';
import { SpeechNotification } from '@app/modal/speech-notifications';
import { SpeechRecognizerService } from '@app/services/speech-recognizer.service';
import { defaultLanguage } from '@app/modal/languages';
import { ActionContext } from '@app/services/actions/action-context';
import { map, merge, Observable, Subject, of } from 'rxjs';
import { SuggestionComponent } from '../suggestion/suggestion.component';
import * as RecordRTC from 'recordrtc';
import { environment } from '@env/environment';
import { CommonService } from '@app/services/common-service.service';
import { I18nService } from '@app/i18n';
import { AuthenticationService } from '@app/auth';
import { LANGUAGE_MAP } from 'src/utils';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, AfterViewInit {
  @ViewChild('suggestedRef', { static: false }) suggestionComponent!: SuggestionComponent;
  @ViewChild('message') myInput!: ElementRef;
  @Output() questionEvent = new EventEmitter();
  @Input() resLength: any;
  interactionArray: any = [];
  currentLanguage: string = defaultLanguage;
  listening$?: Observable<boolean>;
  errorMessage$?: Observable<string>;
  defaultError$ = new Subject<string | undefined>();
  totalTranscript?: string;
  checkSuggestedQues: boolean = true;
  enableSuggestedQuesBox: boolean = false;
  hideSuggestionBox: boolean = false;
  isInputDisabled: boolean = false;
  questionText: any;
  sendQuesTofeedback: any;
  inputValue!: any;
  sendDisabled: boolean = false;
  suggestionsEnabled: boolean = false;
  suggestedToken: any;
  recording: boolean = false;
  started: boolean = false;
  record: any;
  error: string = '';
  whisperUrl: string = '';
  whisperApiKey: string = '';
  detectedLanguageCode: any;
  user_name = '';
  placeholderText: string = 'Ask something here...';
  selectedLanguage: string = 'en';
  constructor(
    private speechRecognizer: SpeechRecognizerService,
    private actionContext: ActionContext,
    private elementRef: ElementRef,
    private apiService: CommonService,
    private auth: AuthenticationService,
    private languageService: I18nService
  ) {
    const details: any = auth.getLoggedUser();
    this.user_name = details.preferred_username;
  }

  ngOnInit(): void {
    this.whisperUrl = environment.whisperApiUrl;
    this.whisperApiKey = environment.whisperApiKey;

    const orgId = this.apiService.groupDetailsStr;
    const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
    if (orgIdExists) {
      this.selectedLanguage = LANGUAGE_MAP[this.languageService.language];
      this.languageService.langChange$.subscribe((language) => {
        this.selectedLanguage = LANGUAGE_MAP[language];
      });
    } else {
      this.selectedLanguage = 'en';
    }

    const webSpeechReady = this.speechRecognizer.initialize(this.currentLanguage);
    if (webSpeechReady) {
      this.initRecognition();
    } else {
      this.errorMessage$ = of('Your Browser is not supported. Please try Google Chrome.');
    }
  }

  ngAfterViewInit() {
    // Wrap the focus call in a setTimeout to ensure it runs after Angular's change detection
    setTimeout(() => {
      this.myInput.nativeElement.focus();
    });
  }

  onSendRecieve() {
    this.isInputDisabled = false;
  }
  onSend() {
    this.isInputDisabled = true;
  }

  onRecieveSuggested(token: any) {
    this.suggestedToken = token;
  }

  stopRecording() {
    this.placeholderText = 'Processing the audio.Please wait for a while.';
    this.recording = false;
    if (this.record) {
      this.record.stop(this.processRecording.bind(this));
    }
  }

  initiateRecording() {
    this.placeholderText = 'Recording in progress...';
    if (this.started && this.recording) {
      this.stopRecording();
    }
    this.recording = true;
    this.inputValue = '';
    let mediaConstraints = {
      video: false,
      audio: true,
    };
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }
  async processRecording(blob: Blob) {
    let body: FormData = new FormData();
    body.append('session_id', 'sadas');
    body.append('language', this.selectedLanguage);
    body.append('model', 'whisper-1');
    body.append('file', blob, 'audio.wav');
    try {
      const response = await fetch(environment.whisperApiUrl, {
        method: 'POST',
        headers: {
          Authorization: environment.whisperApiKey,
        },
        body,
      });
      const transcriptionText = await response.json();
      const { text } = transcriptionText;
      this.totalTranscript = text;
      this.inputValue = text;
      this.isInputDisabled = false;
      this.sendDisabled = true;
    } catch (error: any) {
      console.error('Error during transcription:', error.message);
    }
  }
  errorCallback(_error: any) {
    this.error = 'Can not play audio in your browser';
  }

  successCallback(stream: MediaStream) {
    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, {
      mimeType: 'audio/wav',
      numberOfAudioChannels: 1,
      bitrate: 16000,
    });
    this.record.record();
  }

  private processNotification(notification: SpeechNotification<string>): void {
    if (notification.event === SpeechEvent.FinalContent) {
      const message = notification.content?.trim() || '';
      this.actionContext.processMessage(message, this.currentLanguage);
      this.inputValue = this.inputValue ? `${message}` : notification.content;
      this.onInputChange();
    }
  }

  private initRecognition(): void {
    this.speechRecognizer.onResult().subscribe((notification) => {
      this.processNotification(notification);
    });

    this.listening$ = merge(this.speechRecognizer.onStart(), this.speechRecognizer.onEnd()).pipe(
      map((notification) => notification.event === SpeechEvent.Start)
    );

    this.errorMessage$ = merge(this.speechRecognizer.onError(), this.defaultError$).pipe(
      map((data) => {
        if (data === undefined) {
          return '';
        }
        if (typeof data === 'string') {
          return data;
        }
        let message;
        switch (data.error) {
          case SpeechError.NotAllowed:
            message = `Cannot run the demo.
            Your browser is not authorized to access your microphone.
            Verify that your browser has access to your microphone and try again.`;
            break;
          case SpeechError.NoSpeech:
            message = `No speech has been detected. Please try again.`;
            break;
          case SpeechError.AudioCapture:
            message = `Microphone is not available. Plese verify the connection of your microphone and try again.`;
            break;
          default:
            message = '';
            break;
        }
        return message;
      })
    );
  }
  send(query: any, source: any) {
    this.placeholderText = 'Ask something here...';
    this.hideSuggestions();
    if (this.recording) {
      // If recording is in progress, stop it and do not process the recorded text.
      this.stopRecording();
    } else {
      if (query == '' || query == undefined || query == null) {
        // Handle empty query as needed.
      } else {
        query = query.replaceAll('?', '');
        query = query.substr(0, 1).toUpperCase() + query.substr(1, query.length - 1);
        this.questionText = query;
        this.sendQuestion(source);
      }
    }
    this.inputValue = '';
  }

  async sendQuestion(source: any) {
    if (this.questionText && this.questionText.trim() !== '') {
      this.onSend();
      const orgId = this.apiService.groupDetailsStr;
      const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
      if (!orgIdExists) {
        this.detectedLanguageCode = 'en';
      } else {
        try {
          if (this.selectedLanguage !== 'en') {
            const response = await this.apiService.detectLanguage(this.questionText).toPromise();
            this.detectedLanguageCode = response.payload.language;
          } else {
            this.detectedLanguageCode = 'en';
          }
        } catch (error) {
          console.log(error);
          this.detectedLanguageCode = 'en';
        }
      }
      this.questionEvent.emit({
        ques: this.questionText,
        source: source,
        detectedLanguage: this.detectedLanguageCode,
      });
      this.questionText = '';
    }
    this.inputValue = null;
    this.sendDisabled = false;
  }

  onInputChange() {
    // Check if the input value is not empty
    if (this.inputValue && this.inputValue.trim() !== '') {
      this.sendDisabled = true;
    } else {
      this.sendDisabled = false; // Disable the "Send" button
    }
  }

  adjustTextareaHeight(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  resetFooter() {
    this.placeholderText = 'Ask something here...';
    this.inputValue = '';
    this.sendDisabled = false;
    const textarea = this.elementRef.nativeElement.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
    }
    this.hideSuggestions();
  }

  changeQues($event: any) {
    this.inputValue = $event;
    this.send(this.inputValue, 'APURVA_SUGGESTED');
    this.sendDisabled = true;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send((event.target as HTMLTextAreaElement).value, 'USER');
      (event.target as HTMLTextAreaElement).value = '';
      this.resetFooter();
    }
  }

  enableSuggestions() {
    this.suggestionsEnabled = true;
  }
  hideSuggestions() {
    this.suggestionsEnabled = false;
  }

  @HostListener('document:click', ['$event'])
  onGlobalClick(event: { target: any }): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // clicked outside => close dropdown list
      this.hideSuggestions();
    }
  }
}
