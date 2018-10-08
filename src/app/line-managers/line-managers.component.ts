import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';

@Component({
  selector: 'app-line-managers',
  templateUrl: './line-managers.component.html',
  styleUrls: ['./line-managers.component.scss'],
  // Add this:
  animations: [
    trigger('listStagger', [
      transition('* <=> *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(-15px)' }),
            stagger(
              '50ms',
              animate(
                '550ms ease-out',
                style({ opacity: 1, transform: 'translateY(0px)' })
              )
            )
          ],
          { optional: true }
        ),
        query(':leave', animate('50ms', style({ opacity: 0 })), {
          optional: true
        })
      ])
    ])
  ]
})
export class LineManagersComponent implements OnInit {

  managers: Observable<any[]>;
  managees: Observable<any[]>;
  managersActualList: Observable<any[]>;

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() { 
    this.managers = this.db.list('employees', 
      ref => ref.orderByChild('IsLineManager').equalTo(true)).snapshotChanges();
    this.managersActualList = this.managers;

    /*this.managers.pipe(map(changes =>
      changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
    ));.subscribe((managers) => {
      //this.getManagees(managers[0].key);
      console.log(managers);
    });*/
    //this.managers.forEach(ref=> console.log(ref[0].payload.key))
    
    // this.managers.pipe(map(changes =>
    //   changes.map(c => ({
    //     managees: this.getManagees(c.key).forEach(r=>{console.log(r);})
    //   }))
    // ));
    //this.managers.subscribe(ref=>{console.log(ref[0].payload.val())});
  }

  FilterList(val){
    this.managers= this.managersActualList;
    val = val.trim().toLowerCase();

    if(val!= ''){
      this.managers = this.managers.pipe(map(employees => 
        employees.filter(emp => emp.payload.val().FullName.toLowerCase().includes(val))
      ));
      //this.employees.subscribe(ref=>{console.log(ref)})
    }
  }

  MarkUnmarkLM(id, val){
    if(!val || confirm("Are you sure you want to remove this LM?")){
      var ref = this.db.database.ref('/employees');
      ref.child(id).child('IsLineManager').set(!val);
      if(val){
        this.db.database.ref('/line-managers').child(id).remove();
        //this.db.database.ref('/employees').child(id).child('LineManagerID').remove();
        ref.orderByChild('LineManagerID').equalTo(id)
          .once('value').then(function(snapshot){
            snapshot.forEach(function(childSnapshot) {
              ref.child(childSnapshot.key).child('IsLineManagerAssigned').set(false);
              ref.child(childSnapshot.key).child('LineManagerID').remove();
              ref.child(childSnapshot.key).child('LineManagerValue').remove();
          });
        });
      }
    }
  }

  RemoveManagee(id){
    if(confirm("Are you sure you want to remove this managee?")){
      var ref = this.db.database.ref('/employees');

      var lmid = '';
      this.db.object('/employees/' + id + '/LineManagerID').valueChanges().subscribe(obj =>{
        lmid = obj as string;
        ref.child(id).child('IsLineManagerAssigned').set(false);
        ref.child(id).child('LineManagerID').remove();
        ref.child(id).child('LineManagerValue').remove();
        this.db.database.ref('/line-managers').child(lmid).child(id).remove();
      });
    }
  }

  GetManagees(id){
    this.managees = this.db.list('employees', i => i.orderByChild('LineManagerID').equalTo(id)).snapshotChanges();
  }
}
