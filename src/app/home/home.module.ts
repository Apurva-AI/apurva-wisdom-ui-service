import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '@shared';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { ChatModule } from '@app/chat/chat.module';

@NgModule({
  imports: [CommonModule, TranslateModule, SharedModule, HomeRoutingModule, ChatModule],
  declarations: [HomeComponent],
})
export class HomeModule {}
