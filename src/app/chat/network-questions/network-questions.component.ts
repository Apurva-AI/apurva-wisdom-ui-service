import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from '@env/environment';
import { CommonService } from '@app/services/common-service.service';

@Component({
  selector: 'app-network-questions',
  templateUrl: './network-questions.component.html',
  styleUrls: ['./network-questions.component.scss'],
})
export class NetworkQuestionsComponent implements OnInit {
  user_name: any = '';
  questionText: any = '';
  detectedLanguageCode: any = '';
  @Input() isSpinning: boolean = false;
  @Input() networkQuestions: any;
  @Output() networkQuestionEvent = new EventEmitter();
  @Output() refreshClicked = new EventEmitter<void>();

  constructor(private apiService: CommonService) {}

  ngOnInit(): void {}

  async sendNetworkQuestion(question: any) {
    this.questionText = question;
    if (this.questionText && this.questionText.trim() !== '') {
      this.detectedLanguageCode = 'en';
      this.networkQuestionEvent.emit({
        ques: this.questionText,
        source: 'NETWORK',
        detectedLanguage: this.detectedLanguageCode,
      });
    }
  }

  onRefreshIconClick() {
    this.refreshClicked.emit();
  }

  limitedQuestions() {
    const isMobile = window.innerWidth <= 768; // or use a specific breakpoint for mobile devices
    return isMobile ? this.networkQuestions.slice(0, 3) : this.networkQuestions;
  }
}
