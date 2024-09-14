import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { environment } from '@env/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { LANGUAGE_MAP } from 'src/utils';
import { I18nService } from '@app/i18n';
import { CommonService } from '@app/services/common-service.service';
import { AuthenticationService } from '@app/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { getLinkPreview } from 'link-preview-js';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit {
  @ViewChild('showMoreTemplate', { static: true }) showMoreTemplate!: TemplateRef<any>;
  @Input() resResultArr: any[] = [];
  @Input() answerLinks: any[] = [];
  @Input() viewResults!: boolean;
  @Input() viewEnhance!: boolean;
  @Input() resToken!: string;
  resResultArrUsed!: any[];
  resResultArrAnswerRef!: any[];
  resResultArrFiltered!: any[];
  resModal!: any[];
  references: boolean = false;
  otherResources: boolean = false;
  @Input() resOrgId!: any[];
  @Output() enhanceToggleEvent = new EventEmitter<object>();

  filters: { [tag: string]: boolean } = {};
  channels: any[] = [];
  @Output() checkedIDsChange = new EventEmitter<string[]>();
  checkedIDs: string[] = [];
  language!: any;
  uuidArr!: any;
  user_name = '';
  selectedChannelAnswerRef: string = '';
  selectedChannelFiltered: string = '';
  answerLinkNumbers: any;
  translatedChannels: any;
  tagId: any;
  constructor(
    private sanitizer: DomSanitizer,
    private apiService: CommonService,
    private languageService: I18nService,
    private auth: AuthenticationService,
    private modalService: NgbModal
  ) {
    let details: any = auth.getLoggedUser();
    this.user_name = details.preferred_username;
  }

  async ngOnInit(): Promise<void> {
    //select all doc ids for enhance by default
    this.uuidArr = uuidv4();
    const orgId = this.apiService.groupDetailsStr;
    const orgIdExists = environment.orgLanguages.hasOwnProperty(orgId);
    if (orgIdExists) {
      this.language = LANGUAGE_MAP[this.languageService.language];
    } else {
      this.language = 'en';
    }
    this.answerLinkNumbers = new Set(this.answerLinks.map((link) => link.href));
    this.resResultArrUsed = this.resResultArr;

    this.resResultArrUsed = this.resResultArrUsed.map((item, index) => {
      item.original_url = item.public_url;
      item.public_url = this.sanitizer.bypassSecurityTrustResourceUrl(item.public_url);
      item.number = index + 1;
      return item;
    });

    this.resResultArrAnswerRef = this.resResultArrUsed.filter(
      (res) => this.answerLinkNumbers.has(res.original_url) || this.answerLinkNumbers.has(res.source_url)
    );

    this.resResultArrAnswerRef.forEach((ref) => {
      const matchingLink = this.answerLinks.find(
        (link) => link.href === ref.original_url || link.href === ref.source_url
      );
      if (matchingLink) {
        ref.sourceCount = matchingLink.sourceCount;
      }
    });

    // Sort the array based on sourceCount in ascending order
    this.resResultArrAnswerRef.sort((a, b) => a.sourceCount - b.sourceCount);

    this.resResultArrFiltered = this.resResultArrUsed.filter(
      (res) => !this.answerLinkNumbers.has(res.original_url) && !this.answerLinkNumbers.has(res.source_url)
    );
    this.resResultArrUsed.forEach((res) => {
      if (!this.answerLinkNumbers.has(res.original_url) && !this.answerLinkNumbers.has(res.source_url)) {
        res.isUsedEnhance = false;
      }
    });
    this.checkedIDs = this.resResultArr.filter((item) => item.isUsedEnhance).map((item) => item._id);
    this.checkedIDsChange.emit(this.checkedIDs);

    await this.translateChannels();
    await this.translateOrgChannels();
    this.resOrgId.forEach((org) => {
      this.filters[org.channel] = true;
    });
    // this.selectedChannelAnswerRef = this.resOrgId[0].channel;
    // this.selectedChannelFiltered = this.resOrgId[0].channel;

    this.initializeSelectedChannels();
  }

  ngOnChanges(): void {
    if (this.resResultArrUsed) this.updateDocIdsToEnhance();
  }

  initializeSelectedChannels(): void {
    const getFirstAvailableChannel = (resultArr: any[]) => {
      const availableChannels = this.resOrgId
        .map((org) => org.channel)
        .filter((channel) => resultArr?.some((item) => item?.tags?.includes(channel)));
      return availableChannels[0] || (this.resOrgId[0] && this.resOrgId[0].channel) || '';
    };

    this.selectedChannelAnswerRef = getFirstAvailableChannel(this.resResultArrAnswerRef);
    this.selectedChannelFiltered = getFirstAvailableChannel(this.resResultArrFiltered);
  }

  async translateChannels() {
    if (this.language !== 'en') {
      this.translatedChannels = await this.apiService.getTranslatedChannelData();
      this.resResultArrUsed = this.resResultArrUsed.map((item) => {
        item.translatedTags = this.translateTags(item.tags, this.translatedChannels);
        return item;
      });
    }
  }

  async translateOrgChannels() {
    if (this.language !== 'en') {
      this.translatedChannels = this.apiService.getTranslatedChannelData();

      this.resOrgId = this.resOrgId.map((org) => {
        org.translated_channel = this.translateOrgChannel(org.channel, this.translatedChannels);
        return org;
      });
    }
  }

  areAllItemsSelectedForTagAnsRef(tag: string): boolean {
    return this.resResultArrAnswerRef.filter((item) => item?.tags?.includes(tag)).every((item) => item?.isUsedEnhance);
  }

  areAllItemsSelectedForTagFiltered(tag: string): boolean {
    return this.resResultArrFiltered.filter((item) => item?.tags?.includes(tag)).every((item) => item?.isUsedEnhance);
  }

  updateIsUsedEnhanceAnsRef(tag: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.resResultArrAnswerRef.forEach((item) => {
      if (item.tags.includes(tag)) {
        item.isUsedEnhance = isChecked;
      }
    });
    this.updateDocIdsToEnhance();
  }

  updateIsUsedEnhanceFiltered(tag: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.resResultArrFiltered.forEach((item) => {
      if (item.tags.includes(tag)) {
        item.isUsedEnhance = isChecked;
      }
    });
    this.updateDocIdsToEnhance();
  }

  countMatchingItemsAns(channel: string): number {
    return this.resResultArrAnswerRef.filter((item) => item?.tags?.includes(channel)).length;
  }

  countMatchingItemsFilter(channel: string): number {
    return this.resResultArrFiltered.filter((item) => item?.tags?.includes(channel)).length;
  }

  updateDocIdsToEnhance() {
    const firstCheckedIDs = this.resResultArrAnswerRef?.filter((item) => item?.isUsedEnhance).map((item) => item?._id);
    const secondCheckedIDs = this.resResultArrFiltered?.filter((item) => item?.isUsedEnhance).map((item) => item?._id);

    // Use Set to avoid duplicates
    const combinedCheckedIDs = Array.from(new Set([...firstCheckedIDs, ...secondCheckedIDs]));

    this.checkedIDs = combinedCheckedIDs;
    this.checkedIDsChange.emit(this.checkedIDs);
  }

  translateTags(tags: string[], translatedChannels: any): string[] {
    return tags.map((tag) => translatedChannels[tag] || tag);
  }

  translateOrgChannel(channel: string, translatedChannels: any): string[] {
    return translatedChannels[channel] || channel;
  }

  getFirstTwentyWords(paragraph: string) {
    return paragraph?.slice(0, 20) + '...';
  }

  getFirstFortyWords(paragraph: string) {
    return paragraph?.slice(0, 75) + '...';
  }

  addHighlight(text: string, spanStart: number, spanEnd: number): string {
    if (spanStart === 0 && spanEnd === 0) {
      return text;
    }
    return (
      text.slice(0, spanStart) +
      '<mark class="markL">' +
      text.slice(spanStart, spanEnd) +
      '</mark>' +
      text.slice(spanEnd)
    );
  }

  addMultipleSpanHighlight(textArray: string[], spansArray: { span_start: number; span_end: number }[]) {
    let resText: string[] = [];
    textArray.forEach((text, i) => {
      const span = spansArray[i];
      // If span has a valid range, apply the highlight
      let highlightedText;
      if (span.span_start !== 0 || span.span_end !== 0) {
        highlightedText =
          text.slice(0, span.span_start) +
          '<mark class="markL">' +
          text.slice(span.span_start, span.span_end) +
          '</mark>' +
          text.slice(span.span_end);
      } else {
        // If the span is invalid (start and end are both 0), return the original text
        highlightedText = text;
      }
      resText.push(highlightedText);
    });
    return resText;
  }

  replaceLineBreaks(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  toggleRes() {
    this.otherResources = !this.otherResources;
  }

  toggleRef() {
    this.references = !this.references;
  }

  removeSlash(text: string) {
    if (text.startsWith('/')) {
      text = text.substring(1);
    }
    return text;
  }

  getColorForTag(channel: string) {
    for (let i = 0; i < this.resOrgId.length; i++) {
      if (this.resOrgId[i].channel === channel) {
        return this.resOrgId[i].color;
      }
    }
    return null;
  }

  toggleResultSelectionAnsRef(res: any): void {
    this.resResultArrAnswerRef = this.resResultArrAnswerRef.map((item) => {
      if (item._id == res._id) {
        return { ...item, isUsedEnhance: !item.isUsedEnhance };
      }
      return item;
    });
    this.updateDocIdsToEnhance();
  }

  toggleResultSelectionFiltered(res: any): void {
    this.resResultArrFiltered = this.resResultArrFiltered.map((item) => {
      if (item._id == res._id) {
        return { ...item, isUsedEnhance: !item.isUsedEnhance };
      }
      return item;
    });
    this.updateDocIdsToEnhance();
  }

  translateResultsText(res: any) {
    let textArray = res.text;
    let spansArray = res.spans; // Assuming spans is an array of objects with span_start and span_end
    let transResText: string[] = [];
    const startMarker = '<span>';
    const endMarker = '</span>';
    textArray.forEach((text: string, i: string | number) => {
      const span = spansArray[i];
      let highlightedText;
      if (span.span_start !== 0 || span.span_end !== 0) {
        highlightedText =
          text.slice(0, span.span_start) +
          startMarker +
          text.slice(span.span_start, span.span_end) +
          endMarker +
          text.slice(span.span_end);
      } else {
        // If the span is invalid (start and end are both 0), return the original text
        highlightedText = text;
      }
      transResText.push(highlightedText);
    });
    let combinedText = transResText.join(' <sep></sep> ');
    // Perform the translation for the specific result item
    this.apiService.translateText(combinedText, 'en', this.language).subscribe(
      async (response: any) => {
        const translatedText = response.payload.data;
        let translatedArray = translatedText.split(/\s*<sep><\/sep>\s*/);
        translatedArray = translatedArray.map(
          (text: string) =>
            text
              .replace(/<span>/g, '<mark class="markL">') // Replace opening <span> with <mark>.
              .replace(/<\/span>/g, '</mark>') // Replace closing </span> with </mark>.
        );
        res.translatedText = translatedArray;
      },
      (error) => {
        console.error(error);
        const errorMessage = "Sorry, we couldn't translate";
        res.translatedText = errorMessage;
      }
    );
  }

  disableRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  enhanceToggle() {
    this.enhanceToggleEvent.emit();
  }

  selectChannelAnsRef(channel: string) {
    this.selectedChannelAnswerRef = channel;
  }

  selectChannelFiltered(channel: string) {
    this.selectedChannelFiltered = channel;
  }

  getRGBAColor(hex: string, alpha: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  open(content: any, res: any) {
    this.resModal = [res];
    this.modalService.open(content, { size: 'xl', modalDialogClass: 'modalBg' }).result.then(
      (result) => {
        console.log(`Closed with: ${result}`);
      },
      (reason) => {
        console.log(`Dismissed ${this.getDismissReason(reason)}`);
      }
    );
    let interactData = {
      type: 'VIEW',
      subtype: 'show',
      id: res._id,
      extra: {
        pos: [{}],
        values: [],
        tid: '',
        uri: '',
      },
    };
    this.apiService.createTelemetryEvent(interactData);
  }

  getDismissReason(reason: any): string {
    this.resModal = [];
    if (reason === 'ESC') {
      return 'by pressing ESC';
    } else if (reason === 'BACKDROP_CLICK') {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getSpanHighlightedText(res: any) {
    if (!res.text) return null;
    return this.addMultipleSpanHighlight(res.text, res.spans);
  }
}
