import { Component, EventEmitter, Input, Output } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-floating-action-menu',
  templateUrl: './floating-action-menu.component.html',
  styleUrls: ['./floating-action-menu.component.scss'],
  animations: [
    trigger('rotateAnimation', [
      state('closed', style({ transform: 'rotate(0deg)' })),
      state('open', style({ transform: 'rotate(45deg)' })),
      transition('closed <=> open', animate('300ms ease-in-out')),
    ]),
    trigger('expandMenu', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void <=> *', animate('200ms ease-out')),
    ]),
  ],
})
export class FloatingActionMenuComponent {
  @Output() resultsVisibilityMenu = new EventEmitter<boolean>();
  @Output() enhanceVisibilityMenu = new EventEmitter<boolean>();
  @Input() viewResults!: boolean;
  @Input() viewEnhance!: boolean;
  @Input() isMobile!: boolean;
  @Input() resLength!: number;
  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  toggleEnhance() {
    this.enhanceVisibilityMenu.emit();
  }

  toggleResults() {
    this.resultsVisibilityMenu.emit();
  }
}
