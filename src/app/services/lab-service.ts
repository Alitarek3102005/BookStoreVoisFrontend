import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LabService {
  getAllLabs(): Observable<any[]> {
    return of([
      { id: 'l1', title: 'Visual Data Structures', subtitle: 'Interactive B-Tree Sorting', tech: 'HTML5 Canvas', difficulty: 'Intermediate', imgURL: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=400' },
      { id: 'l2', title: 'Physics Engine Sandbox', subtitle: 'Collision Detection', tech: 'WebGL / Three.js', difficulty: 'Advanced', imgURL: 'https://images.unsplash.com/photo-1614729939124-03290b56c9ce?auto=format&fit=crop&q=80&w=400' }
    ]);
  }
}