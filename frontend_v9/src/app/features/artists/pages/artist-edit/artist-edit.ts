import { Component } from '@angular/core';
import { ArtistForm } from '../../components/artist-form/artist-form';

@Component({ selector: 'app-artist-edit', standalone: true, imports: [ArtistForm], template: '<app-artist-form />' })
export class ArtistEdit {}
