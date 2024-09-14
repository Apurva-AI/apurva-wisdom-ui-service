import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthenticationService } from '@app/auth/authentication.service';
import { I18nService } from '@app/i18n';
import { CommonService } from '@app/services/common-service.service';
import { environment } from '@env/environment';
import { LANGUAGE_MAP } from 'src/utils';
import * as marked from 'marked';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss'],
})
export class AnswerComponent implements OnInit {
  @Input() resAnswer!: any;
  @Output() answerEvent = new EventEmitter<[string, Array<any>]>();
  @Input() isLanguageMismatch: boolean = false;
  @Input() translationError: boolean = false;
  @Input() detectedLanguageCode!: string;
  @Input() quesToken!: string;
  @Output() isAnswerLoaded = new EventEmitter<void>();

  answerLoaded: boolean = false;
  links: { id: number; url: string }[] = [];
  questiontext!: string;
  answertext = '';
  translatedAnswer!: string;
  user_name = '';
  translationErrorMessage = 'Not able to proceed at this moment.Please try after sometime.';
  linkInfoArray: any[] = [];
  constructor(
    private apiService: CommonService,
    private languageService: I18nService,
    private auth: AuthenticationService
  ) {
    let details: any = auth.getLoggedUser();
    this.user_name = details.preferred_username;
  }
  async ngOnInit() {
    const predefinedResponses = [
      'We couldnt find an appropriate solution from your/public sources, Please try again later',
      'The input question is not in alignment with the chosen language. Please pose your question in the selected language or in English.',
    ];

    if (predefinedResponses.includes(this.resAnswer)) {
      this.questiontext = this.resAnswer;
      this.answertext = this.resAnswer;
    } else {
      if (this.resAnswer != this.quesToken) {
        this.questiontext = this.resAnswer;
        await this.markDownFormat(this.resAnswer)
          .then(async (formattedAnswer) => {
            await this.markDownFormatEnd(this.resAnswer);
            this.answerEvent.emit([this.resAnswer, this.linkInfoArray]);
            this.answertext = formattedAnswer;
          })
          .catch((error) => {
            console.error('Error formatting markdown:', error);
          });
      } else {
        let responseTrigger: Boolean = false;
        let apiRequest = this.apiService.getAnswer(this.resAnswer);
        let language = 'en';
        const orgId = this.apiService.groupDetailsStr;
        const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
        if (orgIdExists) {
          language = LANGUAGE_MAP[this.languageService.language];
        }
        apiRequest.subscribe(async (data: any) => {
          if (data.partialText || data.body) {
            if (data.partialText != '' && data?.partialText?.length > 5) {
              this.questiontext = await this.markDownFormat(data.partialText);
              this.answertext = await this.markDownFormat(data.partialText);
            }
          }
          if (data.body) {
            if (!responseTrigger) {
              responseTrigger = true;
              this.apiService.answerStartedEvent(this.resAnswer);
            }
            if (language === 'en') {
              this.answertext = await this.markDownFormat(data.body);
            }
            this.translatedAnswer = await this.markDownFormat(data.body);
            await this.markDownFormatEnd(data.body);
            if (language !== 'en') {
                // Extract the [[NUMBER]](text) pairs and their positions
                const extractedTexts: { [placeholder: string]: string } = {};
                const textWithPlaceholders = data.body.replace(/(\[\[\d+\]\])\([^\(\)]*?\)/g, (match: string, p1: string) => {
                  if (!extractedTexts[p1])
                    extractedTexts[p1] = match;
                  return p1; // Replace with the original [[NUMBER]] placeholder
                });
                this.apiService.translateText(textWithPlaceholders, 'en', language).subscribe(
                  async (response: any) => {
                    let translateApiResponse = response.payload.data;
                    // Reinsert the full [[NUMBER]](text) pairs by replacing unique placeholders
                    Object.keys(extractedTexts).forEach((placeholder) => {
                      const escapedPlaceholder = placeholder.replace(/\[\[/g, '\\[\\[').replace(/\]\]/g, '\\]\\]');
                      const regex = new RegExp(escapedPlaceholder, 'g');
                      translateApiResponse = translateApiResponse.replace(regex, extractedTexts[placeholder]);
                    });
                    this.answertext = await this.markDownFormat(translateApiResponse)
                  },
                  (error) => {
                    console.log(error);
                    this.answertext = "Sorry we could'nt translate";
                  }
                );
            }
            this.answerLoaded = true;
            this.links = this.extractLinks(data.body);
            this.answerEvent.emit([data.body, this.linkInfoArray]);
          }
        });
      }
    }
    this.isAnswerLoaded.emit();
  }

  async markDownFormat(markdownText: string): Promise<string> {
    const renderer = new marked.Renderer();
    let sourceCount = 0;
    const linkMap = new Map<string, number>();
    renderer.link = function ({ href, title, text }) {
      const target = href.startsWith('http') ? ' target="_blank" class="typingAnchor"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      if (!linkMap.has(text)) {
        sourceCount++;
        linkMap.set(text, sourceCount);
      }
      const linkNumber = linkMap.get(text);
      return `<a href="${href}"${target}${titleAttr}>[${linkNumber}]</a>`;
    };
    marked.setOptions({
      renderer: renderer,
    });
    let html = marked.parse(markdownText);
    return html;
  }

  async markDownFormatEnd(markdownText: string): Promise<string> {
    const renderer = new marked.Renderer();
    let sourceCount = 0;
    const linkMap = new Map<string, number>();
    this.linkInfoArray = [];

    renderer.link = ({ href, title, text }: marked.Tokens.Link) => {
      const target = href.startsWith('http') ? ' target="_blank"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      // Extract the full number from the text
      const match = text.match(/\[(\d+)\]/);
      if (match) {
        const fullNumber = match[1]; // Capture the full number

        if (!linkMap.has(href)) {
          sourceCount++;
          linkMap.set(href, sourceCount);
          this.linkInfoArray.push({
            number: Number(fullNumber),
            sourceCount: sourceCount,
            href,
          });
        }
      }

      return `<a href="${href}"${target}${titleAttr}>[]</a>`;
    };
    marked.setOptions({
      renderer: renderer,
    });
    let html = marked.parse(markdownText);
    return html;
  }

  extractLinks(text: string) {
    const regex = /\[\[([0-9]+)\]\]\((https?:\/\/[^\)]+)\)/g;
    let links = [];
    let uniqueUrls = new Set();
    let match;
    let i = 1;

    while ((match = regex.exec(text)) !== null) {
      const url = match[2];
      if (!uniqueUrls.has(url)) {
        links.push({ id: i, url: url });
        uniqueUrls.add(url);
        i++;
      }
    }
    return links;
  }
}
