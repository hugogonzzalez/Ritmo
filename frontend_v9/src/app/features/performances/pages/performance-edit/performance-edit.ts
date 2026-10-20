import { Component } from '@angular/core';
import { PerformanceForm } from '../../components/performance-form/performance-form';

@Component({ selector: 'app-performance-edit', standalone: true, imports: [PerformanceForm], template: '<app-performance-form />' })
export class PerformanceEdit {}
