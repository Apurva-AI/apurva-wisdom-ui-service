import { Component, OnInit, OnChanges, ViewChild } from '@angular/core';
import { CommonService } from '@app/services/common-service.service';
import { Router } from '@angular/router';
import { ChatHistoryComponent } from '../chat-history/chat-history.component';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})
export class SideNavComponent implements OnInit {
  constructor(private apiService: CommonService, private router: Router) {}
  @ViewChild(ChatHistoryComponent)
  chatHistory!: ChatHistoryComponent;
  isHidden = true;
  ngOnInit(): void {}
  hide() {
    this.isHidden = !this.isHidden;
  }
  reloadPage(): void {
    if (this.chatHistory) {
      this.chatHistory.clearSelection();
    }
    this.apiService.generateSessionID();
    const sessionId = this.apiService.getSessionID();
    this.router.navigate(['/chat', sessionId]);
  }
}
