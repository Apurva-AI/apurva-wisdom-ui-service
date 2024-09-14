import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatComponent } from './chat.component';
import { FooterComponent } from './footer/footer.component';
import { SuggestionComponent } from './suggestion/suggestion.component';
import { QueryComponent } from './query/query.component';
import { LoaderComponent } from './loader/loader.component';
import { ResponseComponent } from './response/response.component';
import { AnswerComponent } from './response/answer/answer.component';
import { ResultsComponent } from './response/results/results.component';
import { ResponseFooterComponent } from './response/response-footer/response-footer.component';
import { EnhanceComponent } from './enhance/enhance.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FloatingActionMenuComponent } from './floating-action-menu/floating-action-menu.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NetworkQuestionsComponent } from './network-questions/network-questions.component';
@NgModule({
  declarations: [
    ChatComponent,
    FooterComponent,
    SuggestionComponent,
    QueryComponent,
    LoaderComponent,
    ResponseComponent,
    AnswerComponent,
    ResultsComponent,
    ResponseFooterComponent,
    EnhanceComponent,
    FloatingActionMenuComponent,
    NetworkQuestionsComponent,
  ],
  imports: [CommonModule, ChatRoutingModule, MatExpansionModule, FormsModule, TranslateModule, BrowserAnimationsModule],
  exports: [ChatComponent],
})
export class ChatModule {}
