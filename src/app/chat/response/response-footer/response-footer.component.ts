import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonService } from '@app/services/common-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-response-footer',
  templateUrl: './response-footer.component.html',
  styleUrls: ['./response-footer.component.scss'],
})
export class ResponseFooterComponent implements OnInit {
  @Output() reactionEvent = new EventEmitter<object>();
  @Input() isCommonPhrase!: boolean;
  @Input() questionText!: any;
  @Input() querySource!: any;
  @Input() resanswer!: any;
  @Input() data!: any;
  @Input() responseId!: string;
  @Input() responseFooterVisible!: boolean;
  @Input() token: any;
  @Input() feedbackReaction: any;
  disabled: boolean = false;
  isLiked: boolean = false;
  isDisliked: boolean = false;
  feedbackText: string = '';
  react: any;

  @ViewChild('feedbackModal') feedbackModal!: ElementRef;

  constructor(private apiService: CommonService, private modalService: NgbModal) {}

  ngOnInit(): void {
    if (this.feedbackReaction) {
      if (this.feedbackReaction === 'like') {
        this.isLiked = true;
        this.isDisliked = false;
      } else if (this.feedbackReaction === 'dislike') {
        this.isLiked = false;
        this.isDisliked = true;
      }
    }
  }

  callReactionEvent(react: any) {
    let obj = {
      questionText: this.questionText.ques,
      questionSource: this.querySource,
      answerText: { answer: this.resanswer, result: JSON.stringify(this.data) },
      reaction: react,
      token: this.token,
    };
    if (this.feedbackText.trim()) {
      obj['feedback'] = this.feedbackText;
    }
    this.apiService.createTelemetryEvent(obj);
    this.disabled = true;
    // if (react == 'dislike') {
    //   this.feedbackVisible = true;
    //   setTimeout(() => {
    //     this.textarea?.nativeElement.scrollIntoView({ block: "end" });
    //   }, 500);

    // }
    let objArr = {
      id: this.responseId,
      reaction: react,
    };
    this.reactionEvent.emit(objArr);
  }

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.isDisliked = false; // Reset dislike state
    this.open(this.feedbackModal, 'like');
  }

  toggleDislike() {
    this.isDisliked = !this.isDisliked;
    this.isLiked = false; // Reset like state
    this.open(this.feedbackModal, 'dislike');
  }

  open(content: any, react: any) {
    this.react = react;
    this.feedbackText = '';
    this.modalService.open(content, { size: 'xl', windowClass: 'custom-modal-window' }).result.then(
      (result) => {
        this.feedbackText = result;
      },
      (reason) => {
        console.log(`Dismissed ${this.getDismissReason(reason)}`);
      }
    );
  }

  getDismissReason(reason: any): string {
    if (reason === 'ESC') {
      return 'by pressing ESC';
    } else if (reason === 'BACKDROP_CLICK') {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  closeModal(modal: any) {
    this.feedbackText = '';
    modal.dismiss('close button click');
    this.callReactionEvent(this.react);
  }

  submitFeedback(modal: any, react: any) {
    modal.close(this.feedbackText);
    this.callReactionEvent(react);
    this.feedbackText = '';
  }
}
