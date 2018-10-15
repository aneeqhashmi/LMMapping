import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Line-Management-System';
  employees: Observable<any[]>;
  empCount: number = 0;

  constructor(public db: AngularFireDatabase){

  }
  
  ngOnInit(){
    this.employees = this.db.list('employees', ref=> ref.orderByChild('IsLineManagerAssigned').equalTo(false)).snapshotChanges().pipe(map(changes =>{
      var list = changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty('FullName'))
      this.empCount = list.length;
      return list;
    }));
  }

  SortByProperty(prop){
    return function (x, y) {
      return ((x[prop] == y[prop]) ? 0 : ((x[prop] > y[prop]) ? 1 : -1));
    };
  }

  onLogOut(){
    alert('logout')
  }
  
}
