import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss']
})
export class EmployeeDetailsComponent {

  employee: any;
  employees: Observable<any[]>;
  managers: Observable<any[]>;
  managees: Observable<any[]>;
  emp$: string = '0';

  constructor(private route: ActivatedRoute, public db: AngularFireDatabase, private router: Router){
    this.route.params.subscribe(params =>  {
      this.emp$ = (params.id ? params.id : '0'); 
      this.loadData();
    });
  }

  SortByName(x,y) {
    return ((x.FullName == y.FullName) ? 0 : ((x.FullName > y.FullName) ? 1 : -1 ));
  }

  loadData(){
    if(this.emp$ != '0'){
      this.db.database.ref('employees').child(this.emp$).once('value').then((snapshot)=>{
        this.employee= snapshot.val();
        if(this.employee.IsLineManager)
          this.managees = this.db.list('employees', ref => ref.orderByChild('LineManagerID').equalTo(this.emp$))
            .snapshotChanges().pipe(map(changes =>
              changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByName)
            ));
        else
          this.managees = null;
          
        if(this.employee.IsManagingDirector)
         this.managers = this.db.list('employees', ref => ref.orderByChild('ManagingDirectorID').equalTo(this.emp$))
          .snapshotChanges().pipe(map(changes =>
            changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByName)
          ));
         else
          this.managers = null
      });
    }
    else{
      this.router.navigate(['']); 
    }
  }
}
