import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Concert } from '../../../../core/models/concert.model';

@Component({
  selector: 'app-concert-card',
  standalone: true,
  imports: [DatePipe],
  template: `<article class="concert-card"><span class="card-date">{{ concert.date | date:'dd MMM yyyy':'':'es-ES' }}</span><h3>{{ concert.title }}</h3><p>{{ concert.venue }}, {{ concert.city }}</p><strong>{{ concert.price | number:'1.2-2':'es-ES' }} €</strong></article>`,
  styles: [`.concert-card{padding:17px;border:1px solid #e7ebf1;border-radius:12px;background:#fff}.card-date{color:#0878f9;font-size:10px;font-weight:700;text-transform:uppercase}.concert-card h3{margin:9px 0 4px;color:#293345;font:700 14px 'Space Grotesk',sans-serif}.concert-card p{margin:0 0 12px;color:#7c8798;font-size:11px}.concert-card strong{color:#30394a;font-size:12px}`]
})
export class ConcertCard {
  @Input({ required: true }) concert!: Concert;
}
