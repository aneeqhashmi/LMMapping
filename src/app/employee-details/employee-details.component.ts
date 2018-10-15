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
        this.employee.key = snapshot.key;
        
        if(this.employee.IsLineManagerAssigned){
          this.db.database.ref('employees').child(this.employee.LineManagerID).once('value').then((lm)=>{
            this.employee.ManagingDirectorID = lm.val().ManagingDirectorID;
            this.employee.ManagingDirectorValue = lm.val().ManagingDirectorValue;
          });
        }

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

  RemoveManagee(id){
    if(confirm("Are you sure you want to remove this managee?")){
      var ref = this.db.database.ref('/employees');

      this.db.object('/employees/' + id + '/LineManagerID').valueChanges().subscribe(obj =>{
        var lmid = obj as string;
        ref.child(id).child('IsLineManagerAssigned').set(false);
        ref.child(id).child('LineManagerID').remove();
        ref.child(id).child('LineManagerValue').remove();
        this.db.database.ref('/line-managers').child(lmid).child(id).remove();
        //this.loadData();
      });
    }
  }

  RemoveManager(id){
    if(confirm("Are you sure you want to remove this manager?")){
      var ref = this.db.database.ref('/employees');

      var edid = '';
      this.db.object('/employees/' + id + '/ManagingDirectorID').valueChanges().subscribe(obj =>{
        edid = obj as string;
        ref.child(id).child('IsManagingDirectorAssigned').set(false);
        ref.child(id).child('ManagingDirectorID').remove();
        ref.child(id).child('ManagingDirectorValue').remove();
        this.db.database.ref('/directors').child(edid).child(id).remove();
      });
    }
  }
}
