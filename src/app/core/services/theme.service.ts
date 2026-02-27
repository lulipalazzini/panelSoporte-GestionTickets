import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark =
      saved === 'dark' ||
      (saved === null &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    this.apply(prefersDark);
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    document.body.classList.toggle(DARK_CLASS, dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
