import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/auth/authentication.service';
import { CommonService } from '@app/services/common-service.service';
import { NavigationEnd, Router } from '@angular/router';
@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.scss'],
})
export class ChatHistoryComponent implements OnInit {
  user_name: any = '';
  uniqueSessions: any;
  selectedSessionId: string = '';
  constructor(private auth: AuthenticationService, private apiService: CommonService, private router: Router) {
    let details: any = auth.getLoggedUser();
    this.user_name = details.preferred_username;
  }

  ngOnInit(): void {
    this.apiService.getUniqueSessions(this.user_name).subscribe(
      (response) => {
        if (response) {
          this.uniqueSessions = response.data;
        }
      },
      (error) => {
        console.error('Error fetching unique sessions:', error);
      }
    );
  }

  selectSession(sessionId: string) {
    console.log('Selected Session ID:', sessionId);
    this.selectedSessionId = sessionId;
  }

  clearSelection() {
    this.selectedSessionId = '';
  }
}
