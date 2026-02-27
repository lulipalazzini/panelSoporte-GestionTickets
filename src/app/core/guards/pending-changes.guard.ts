import { CanDeactivateFn } from '@angular/router';

export interface PendingChanges {
  hasUnsavedChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<PendingChanges> = (
  component,
) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return window.confirm(
    '¿Tienes cambios sin guardar. ¿Seguro que quieres salir?',
  );
};
