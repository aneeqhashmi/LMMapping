import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss']
})
export class EmployeeDetailsComponent implements OnInit {

  employee: any;
  employees: Observable<any[]>;
  managers: Observable<any[]>;
  managees: Observable<any[]>;
  emp$: string = '0';

  constructor(private route: ActivatedRoute, public db: AngularFireDatabase, private router: Router){
    this.route.params.subscribe(params =>  this.emp$ = params.id ? params.id : '0');

    this.router.routeReuseStrategy.shouldReuseRoute = function(){
      return false;
   }

   this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
         // trick the Router into believing it's last link wasn't previously loaded
         this.router.navigated = false;
         // if you need to scroll back to top, here is the right place
         window.scrollTo(0, 0);
      }
  });
  }

  ngOnInit(){
    if(this.emp$ != '0'){
      this.db.database.ref('employees').child(this.emp$).once('value').then((snapshot)=>{
        this.employee= snapshot.val();
        if(this.employee.IsLineManager)
          this.managees = this.db.list('employees', ref => ref.orderByChild('LineManagerID').equalTo(this.emp$)).snapshotChanges();
        if(this.employee.IsManagingDirector)
         this.managers = this.db.list('employees', ref => ref.orderByChild('ManagingDirectorID').equalTo(this.emp$)).snapshotChanges();
      });
    }
    else{
      this.router.navigate(['']); 
    }
  }


}
