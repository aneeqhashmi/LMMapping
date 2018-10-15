import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-recently-added',
  templateUrl: './recently-added.component.html',
  styleUrls: ['./recently-added.component.scss']
})
export class RecentlyAddedComponent implements OnInit {

  employees: Observable<any[]>;
  filterBy: string = 'today';
  filterOnText: string = 'AddedOnWT';
  empCount: number = 0;

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() {
    this.getEmployees();
  }

  getEmployees() {
    var filteringDate = new Date();
    switch (this.filterBy) {
      case 'today':
      filteringDate.setDate(filteringDate.getDate());
      break;

      case 'yesterday':
      filteringDate.setDate(filteringDate.getDate() - 1);
      break;
      
      case 'week':
      filteringDate.setDate(filteringDate.getDate() - 7);
      break;

      case 'month':
      filteringDate.setDate(filteringDate.getDate() - 30);
      break;
      
      case 'year':
      filteringDate.setDate(filteringDate.getDate() - 365);
      break;
      default:
        break;
    }

    var dateWT = new Date(filteringDate.getFullYear(), filteringDate.getMonth(), filteringDate.getDate());

    if(this.filterBy == 'today' || this.filterBy == 'yesterday'){
      this.employees = this.db.list('employees', ref => ref.orderByChild(this.filterOnText).equalTo(dateWT.getTime()))
        .snapshotChanges().pipe(map(changes =>{
          var fil = changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty('FullName'))
          this.empCount = fil.length;
          return fil;
      }));
    }
    else{
      this.employees = this.db.list('employees', ref => ref.orderByChild(this.filterOnText).startAt(dateWT.getTime()))
        .snapshotChanges().pipe(map(changes =>{
        var fil = changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty('FullName'))
        this.empCount = fil.length;
        return fil;
      }));
    }
    
  }

  SortByProperty(prop){
    return function (x, y) {
      return ((x[prop] == y[prop]) ? 0 : ((x[prop] > y[prop]) ? 1 : -1));
    };
  }

  FilterCriteriaChange(val){
    this.filterOnText = val;
  }
}
