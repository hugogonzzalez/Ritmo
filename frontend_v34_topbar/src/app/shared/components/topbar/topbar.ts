import { Component, computed, input, output, signal } from '@angular/core';
import { LucideLogOut } from '@lucide/angular';

const AVATAR_COLORS = ['#0878f9', '#e5484d', '#30a46c', '#f76b15', '#8e4ec6', '#d6409f', '#12a594', '#c79a1a'];

// Presentacional: muestra usuario, rol, avatar (o iniciales) y el cierre de sesión.
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [LucideLogOut],
  template: `
    <header class="topbar">
      <div class="user-box">
        @if (avatarUrl()) {
          <img class="avatar" [src]="avatarUrl()" [alt]="userName()">
        } @else {
          <span class="avatar initials" [style.background]="avatarColor()">{{ initials() }}</span>
        }
        <div class="user-text">
          <strong>{{ userName() }}</strong>
          <small>{{ roleLabel() }}</small>
        </div>
      </div>
      <button type="button" class="logout-action" (click)="logout.emit()">
        <svg lucideLogOut [size]="15"></svg> Cerrar sesión
      </button>
    </header>
  `,
  styles: [`
    .topbar{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:flex-end;gap:18px;height:64px;padding:0 28px;background:#fff;border-bottom:1px solid #e6eaf0;box-shadow:0 2px 8px #18223206}
    .user-box{display:flex;align-items:center;gap:11px}
    .avatar{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:50%;object-fit:cover}
    .initials{color:#fff;font:700 13px 'Space Grotesk',sans-serif;letter-spacing:.3px}
    .user-text{display:grid;gap:3px;text-align:right}
    .user-text strong{color:#263143;font-size:12px}
    .user-text small{justify-self:end;border-radius:99px;background:#eaf3ff;padding:2px 8px;color:#1769bd;font-size:9px;font-weight:700}
    .logout-action{display:inline-flex;align-items:center;gap:7px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;padding:8px 12px;color:#4b5668;font:600 11px 'DM Sans',sans-serif;cursor:pointer}
    .logout-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}
    @media(max-width:520px){.topbar{padding:0 14px;gap:10px}.user-text small{display:none}.logout-action{padding:7px 9px}}
  `]
})
export class Topbar {
  readonly userName = input('');
  readonly roleLabel = input('');
  readonly avatarUrl = input<string | null>(null);
  readonly logout = output<void>();

  // Color al azar: se elige al crear la barra y se mantiene mientras la sesión está abierta
  readonly avatarColor = signal(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  // Iniciales: primera letra del nombre y primera del apellido (o las dos primeras si solo hay una palabra)
  readonly initials = computed(() => {
    const parts = this.userName().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
    return letters.toUpperCase();
  });
}
