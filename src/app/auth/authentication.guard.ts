import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Logger } from '@shared';
import { AuthenticationService } from './authentication.service';
const log = new Logger('AuthenticationGuard');
@Injectable({
  providedIn: 'root',
})
export class AuthenticationGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isAuthenticated = await this.authenticationService.isLoggedIn();
    if (isAuthenticated) {
      return true;
    }
    log.debug('Not authenticated, redirecting and adding redirect url...');
    this.authenticationService.logout();
    // this.router.navigate([this.keycloakService.logout(window.location.origin)], { queryParams: { redirect: state.url }, replaceUrl: true });
    return false;
  }
}
