import { Component } from '@angular/core';
import { ConcertForm } from '../../components/concert-form/concert-form';

@Component({ selector: 'app-concert-create', standalone: true, imports: [ConcertForm], template: '<app-concert-form />' })
export class ConcertCreate {}
