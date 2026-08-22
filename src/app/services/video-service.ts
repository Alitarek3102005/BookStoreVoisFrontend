import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoService {
  getAllVideos(): Observable<any[]> {
    return of([
      { id: 'v1', title: 'Building Distributed Systems', subtitle: 'Scaling with Spring Cloud', duration: '45:20', tag: 'Architecture', imgURL: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600' },
      { id: 'v2', title: 'JWT Authentication Flows', subtitle: 'Securing .NET APIs', duration: '32:15', tag: 'Security', imgURL: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600' }
    ]);
  }
}