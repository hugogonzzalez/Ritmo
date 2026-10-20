import { Component, Input } from '@angular/core';
import { Concert } from '../../../../core/models/concert.model';

@Component({
  selector: 'app-concert-card',
  standalone: true,
  template: `<article class="concert-card"><h3>{{ concert.title }}</h3><p>{{ concert.slug }}</p></article>`,
  styles: [`.concert-card{padding:17px;border:1px solid #e7ebf1;border-radius:12px;background:#fff}.concert-card h3{margin:9px 0 4px;color:#293345;font:700 14px 'Space Grotesk',sans-serif}.concert-card p{margin:0;color:#7c8798;font-size:11px}`]
})
export class ConcertCard {
  @Input({ required: true }) concert!: Concert;
}
