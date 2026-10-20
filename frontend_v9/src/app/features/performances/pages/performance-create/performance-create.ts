import { Component } from '@angular/core';
import { PerformanceForm } from '../../components/performance-form/performance-form';

@Component({ selector: 'app-performance-create', standalone: true, imports: [PerformanceForm], template: '<app-performance-form />' })
export class PerformanceCreate {}
