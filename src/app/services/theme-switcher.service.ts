import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeSwitcherService {
  private renderer: Renderer2;
  private _currentTheme: 'light' | 'dark' = 'light';
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  get currentTheme(): 'light' | 'dark' {
    return this._currentTheme;
  }

  private setCurrentTheme(theme: 'light' | 'dark') {
    this._currentTheme = theme;
    this.isDarkTheme.next(theme === 'dark');
    this.renderer.setAttribute(document.body, 'class', `${theme}-theme`);
    localStorage.setItem('theme', theme);
  }

  setTheme(theme: 'light' | 'dark') {
    this.setCurrentTheme(theme);
  }

  toggleTheme() {
    const newTheme = this._currentTheme === 'light' ? 'dark' : 'light';
    this.setCurrentTheme(newTheme);
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      this.setCurrentTheme(savedTheme);
    } else if (prefersDark) {
      this.setCurrentTheme('dark');
    } else {
      this.setCurrentTheme('light');
    }
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this._currentTheme;
  }
}
