import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { v4 as uuidv4 } from 'uuid';
import { configuration } from '@app/configuration';
import { AuthenticationService } from '@app/auth';
import { Subject } from 'rxjs';
import { predefinedColors } from '@app/chat/response/color-config';
import { LANGUAGE_MAP } from 'src/utils';
import { I18nService } from '@app/i18n';

declare var AuthTokenGenerate: any;
declare var Telemetry: any;

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private fetchNetworkQuestionsSource = new Subject<void>();
  fetchNetworkQuestions$ = this.fetchNetworkQuestionsSource.asObservable();
  private answerEvent = new EventEmitter<string>();
  predefinedColors: string[] = predefinedColors;
  groupDetails: string[] = [];
  groupDetailsStr!: string;
  promptsArr: any;
  channelData: any[] = [];
  translatedChannels: any;
  sessionId!: string;
  chatAcess: boolean = true;
  language!: string;
  orgName!: any;
  hostName: string = window.location.hostname;
  private isNewSession = false;
  private triggerFunctionSubject = new Subject<void>();
  triggerFunction$ = this.triggerFunctionSubject.asObservable();
  private triggerSuggestionSubject = new Subject<string>();
  triggerSuggestion$ = this.triggerSuggestionSubject.asObservable();

  // Function to trigger the target component's function

  triggerSuggestion(token: any) {
    this.triggerSuggestionSubject.next(token);
  }

  triggerFetchNetworkQuestions(): void {
    this.fetchNetworkQuestionsSource.next();
  }

  triggerFunction() {
    this.triggerFunctionSubject.next();
  }

  private apiUrl = environment.serverUrl;
  private diyDataServiceUrl = environment.diyDataServiceUrl;
  private networkQuestionsUrl = environment.networkQuestionsUrl;
  // private apiUrl = 'http://3.21.244.206:8080';

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private languageService: I18nService
  ) {
    let groupDetailsC: any = authService.parseToken();
    // By default keycloak doesnt return Group details in parseToken API.
    // We have to add mapper called "Group Membership" with name as "groups" in the respective client id
    // It will return the group info in groupDetailsC?.groups
    if (groupDetailsC?.groups?.length > 0) {
      this.groupDetails = groupDetailsC.groups;
      this.groupDetailsStr = this.arrayToString(groupDetailsC.groups);
    } else {
      /** Comment the below line (chatAcess) while enabling Public Group */
      this.chatAcess = false;
      this.groupDetails.push(environment.defaultGroup);
      this.groupDetailsStr = environment.defaultGroup;
    }
    this.groupDetails = this.groupDetails.map((str) => str.replace('/', ''));
    this.orgName = this.groupDetails;
  }

  setIsNewSession(value: boolean): void {
    this.isNewSession = value;
  }

  getIsNewSession(): boolean {
    return this.isNewSession;
  }

  makeCraftAPICall(question: string, userId: string, orgId: string, sessionId: string): Observable<any> {
    const url = `${this.apiUrl}/craft`;
    const requestBody = {
      question,
      user_id: userId,
      org_id: orgId,
      session_id: sessionId,
      org_filter: true,
      graph: false,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post(url, requestBody, { headers });
  }

  generateSessionID() {
    this.sessionId = uuidv4();
    this.setIsNewSession(true);
  }

  getSessionID() {
    return this.sessionId;
  }

  setSessionID(session_id: any) {
    this.sessionId = session_id;
  }

  getResults(token: string): Observable<any> {
    const url = `${this.apiUrl}/results?token=${token}`;
    return this.http.get(url);
  }

  getEnhance(ids: string, prompt: string): Observable<any> {
    const url = `${this.apiUrl}/enhance?session_id=${this.sessionId}&doc_ids=${ids}&prompt=${prompt}&org_id=${this.groupDetailsStr}`;
    return this.http.get(url, { observe: 'events', reportProgress: true, responseType: 'text' });
  }

  answerStartedEvent(msg: string) {
    this.answerEvent.emit(msg);
  }

  getAnswerEvent(): Observable<any> {
    return this.answerEvent;
  }

  getAnswer(token: string): Observable<any> {
    const url = `${this.apiUrl}/answer?token=${token}`;
    return this.http.get(url, { observe: 'events', reportProgress: true, responseType: 'text' });
  }

  getGraph(token: string): Observable<any> {
    const url = `${this.apiUrl}/graph?token=${token}`;
    return this.http.get(url);
  }

  getSuggestions(token: string): Observable<any> {
    const url = `${this.apiUrl}/suggest?token=${token}`;
    return this.http.get(url);
  }

  getPrompts(): Observable<any> {
    const url = `${this.diyDataServiceUrl}/enhance/getPrompts`;
    return this.http.get(url);
  }

  getGroups(group_name: any): Observable<any> {
    return this.http.get<any>(`${this.diyDataServiceUrl}/group/getGroupDetails/${group_name}`);
  }

  getNetworkQuestions(group_name: any, limit: any): Observable<any> {
    return this.http.get<any>(
      `${this.networkQuestionsUrl}/retrieve_questions?org_id=${group_name}&limit=${limit}&wisdom_url=${this.hostName}`
    );
  }

  //Don't remove this code, fetches network questions from db table
  // getNetworkQuestions(groupDetails: any, userName: any): Observable<any> {
  //   return this.http.get<any>(`${this.diyDataServiceUrl}/wisdom/getNetworkQuestions/${groupDetails}/${userName}`);
  // }

  translateText(text: string, srcLangCode: string, tarLangCode: string) {
    const translatedText = this.http.post<any>(`${this.diyDataServiceUrl}/googleapi/translate-text`, {
      text: text,
      srcLang: srcLangCode,
      targetLang: tarLangCode,
    });
    return translatedText;
  }

  detectLanguage(text: string) {
    const detectedLanguage = this.http.post<any>(`${this.diyDataServiceUrl}/googleapi/detect-language`, {
      text: text,
    });
    return detectedLanguage;
  }

  arrayToString(arr: string[]): string {
    const returnVal = arr.map((str) => str.replace('/', ''));
    return returnVal.join('');
  }

  callPrompts() {
    this.getPrompts().subscribe((res) => {
      if (res.code == 200 && res.data.length) {
        this.promptsArr = res.data;
      } else {
        console.log('Error in Prompts call');
      }
    });
  }

  callGroups() {
    this.getGroups(this.groupDetails).subscribe((res) => {
      if (res.code == 200) {
        let data = res.data;
        data.push('Conversations');
        this.channelData = this.extractChannels(data);
        this.translateChannelData();
      } else {
        console.log('Error in groups call');
      }
    });
  }

  async translateChannelData() {
    this.language = LANGUAGE_MAP[this.languageService.language];
    this.translatedChannels = {}; // Initialize the object here

    if (this.language !== 'en') {
      const channelNames = this.channelData.map((channel) => channel.name);

      let channelNamesString = channelNames.toString();
      channelNamesString = channelNamesString.replace(/,/g, '<<~>>');
      try {
        const response = await this.translateText(channelNamesString, 'en', this.language).toPromise();
        if (response && response.payload && response.payload.data) {
          let translationResponse = response.payload.data;
          translationResponse = translationResponse.replace(/<<\s*~\s*>>/g, '<<~>>');
          const channelNameArray = channelNamesString.split('<<~>>');
          const translationArray = translationResponse.split('<<~>>');
          for (let i = 0; i < channelNameArray.length; i++) {
            this.translatedChannels[channelNameArray[i]] = translationArray[i];
          }
          return this.translatedChannels;
        } else {
          console.log(`Translation failed `);
        }
      } catch (error) {
        console.log('error');
        console.log(error);
      }
    }
  }

  async translateSuggestions(questions: string[]) {
    const translatedQuestions: string[] = [];
    if (this.language !== 'en') {
      try {
        const suggestionsString = questions.toString();
        const response = await this.translateText(suggestionsString, 'en', this.language).toPromise();
        if (response && response.payload && response.payload.data) {
          const translationResponse = response.payload.data;
          const suggestionsArray = translationResponse.split(',');
          translatedQuestions.push(...suggestionsArray);
        }
        return translatedQuestions;
      } catch (error) {
        console.error('An error occurred during translation:', error);
      }
    }
    // Add a return statement for the case where this.language === 'en'
    return translatedQuestions;
  }

  getGroupsArr() {
    return this.channelData;
  }

  getTranslatedChannelData() {
    return this.translatedChannels;
  }

  extractChannels(data: any[]): any[] {
    const extractedChannels = [];
    let colorIndex = 0;

    for (const item of data) {
      const channelObj = {
        name: item,
        color: predefinedColors[colorIndex],
      };
      extractedChannels.push(channelObj);
      colorIndex = (colorIndex + 1) % predefinedColors.length; // Increment the color index
    }

    return extractedChannels;
  }

  initTelemetry() {
    let userDetails: any = this.authService.getLoggedUser();
    var key = configuration.telemetryDetails.key;
    var secret = configuration.telemetryDetails.secret;
    var configObj = {
      pdata: configuration.telemetryDetails.config.pdata,
      channel: configuration.telemetryDetails.channel,
      uid: userDetails?.preferred_username != undefined ? userDetails['preferred_username'] : 'user_name',
      did: userDetails['email'],
      sid: this.sessionId,
      authtoken: '',
      host: configuration.telemetryDetails.host,
    };
    let startEdata = configuration.telemetryDetails.startEdata;
    let options = configuration.telemetryDetails.options;
    let token = AuthTokenGenerate.generate(key, secret);
    configObj.authtoken = token;
    Telemetry.start(configObj, 'content_id', 'contetn_ver', startEdata, options);
  }

  createTelemetryEvent(details: any) {
    this.initTelemetry();
    this.response(details);
    this.interact(details);
  }

  response(details: any) {
    details.groupDetails = this.groupDetails;
    var target = {
      id: 'default',
      ver: 'v 0.1',
      type: 'default',
      parent: {
        id: 'p1',
        type: 'default',
      },
      questionsDetails: details,
    };
    var itemResponsedata = {
      qid: '65441',
      type: 'ecml',
      target: target,
      values: [details],
    };
    Telemetry.response(itemResponsedata);
  }

  interact(details: any) {
    Telemetry.interact(details);
    Telemetry.end({});
  }

  getUniqueSessions(userId: string): Observable<any> {
    const url = `${this.diyDataServiceUrl}/wisdom/uniqueSessions/${userId}?wisdom_url=${this.hostName}`;
    return this.http.get(url);
  }

  getSessionDetails(sessionId: string, offset: number, limit: number): Observable<any> {
    const url = `${this.diyDataServiceUrl}/wisdom/sessionDetails/${sessionId}?offset=${offset}&limit=${limit}`;
    return this.http.get(url);
  }

  set groupName(group: string) {
    this.orgName = group;
  }

  get groupName(): string {
    return this.orgName;
  }
}
