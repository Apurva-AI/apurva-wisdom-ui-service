import { Component, OnInit, ViewChild } from '@angular/core';
import { ChatComponent } from '@app/chat/chat.component';
import { QuoteService } from './quote.service';
import { CommonService } from '@app/services/common-service.service';
import { Subscription } from 'rxjs';
import { AuthenticationService } from '@app/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  quote: string | undefined;
  isLoading = false;
  UserAcess: boolean = true;
  @ViewChild(ChatComponent) chat: any;
  constructor(
    private quoteService: QuoteService,
    private apiService: CommonService,
    private auth: AuthenticationService
  ) {
    if (apiService.chatAcess == false) {
      this.UserAcess = false;
    }
  }
  responseArray: any = [];
  ngOnInit() {
    this.apiService.callPrompts();
    this.apiService.generateSessionID();
    this.apiService.callGroups();
  }
  ngAfterViewInit() {
    this.responseArray = this.chat.responseArray;
  }
}
