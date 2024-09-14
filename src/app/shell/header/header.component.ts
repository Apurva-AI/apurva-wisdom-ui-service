import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeSwitcherService } from '../../services/theme-switcher.service';
import { AuthenticationService, CredentialsService } from '@app/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  menuHidden = true;
  currentTheme: any;
  isDarkTheme!: boolean;
  private themeSubscription!: Subscription;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private credentialsService: CredentialsService,
    private themeSwitcher: ThemeSwitcherService
  ) {}

  ngOnInit() {
    this.themeSwitcher.initializeTheme();
    this.themeSubscription = this.themeSwitcher.isDarkTheme$.subscribe((isDark) => (this.isDarkTheme = isDark));
  }

  toggleMenu() {
    this.menuHidden = !this.menuHidden;
  }
  isSideNav = false;

  toggleSideNavMenu() {
    this.isSideNav = !this.isSideNav;
  }

  logout() {
    this.authenticationService.logout();
  }

  get username() {
    const credentials: any = this.authenticationService.getLoggedUser();
    return credentials ? credentials.preferred_username : null;
  }

  toggleTheme() {
    this.themeSwitcher.toggleTheme();
  }
}
