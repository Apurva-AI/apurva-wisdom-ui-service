import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TagsFilterService {
  private filteredTagsSubject = new BehaviorSubject<any>({});

  filteredTags$ = this.filteredTagsSubject.asObservable();

  updateFilteredClusters(tags: any) {
    this.filteredTagsSubject.next(tags);
  }
}
