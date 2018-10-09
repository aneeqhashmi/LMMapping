import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';

@Component({
  selector: 'app-directors',
  templateUrl: './directors.component.html',
  styleUrls: ['./directors.component.scss']
})
export class DirectorsComponent implements OnInit {

  directors: Observable<any[]>;
  managers: Observable<any[]>;
  directorsActualList: Observable<any[]>;

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() {
    this.directors = this.db.list('employees', ref => ref.orderByChild('IsManagingDirector').equalTo(true))
      .snapshotChanges().pipe(map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByName)
      ));
    this.directorsActualList = this.managers;
    //this.directors.subscribe(ref=>{console.log(ref[0].payload.val())})
  }

  SortByName(x,y) {
    return ((x.FullName == y.FullName) ? 0 : ((x.FullName > y.FullName) ? 1 : -1 ));
  }

  FilterList(val){
    this.directors= this.directorsActualList;
    val = val.trim().toLowerCase();

    if(val != ''){
      this.directors = this.directors.pipe(map(employees => 
        employees.filter(emp => emp.FullName.toLowerCase().includes(val))
      ));
    }
  }

  MarkUnmarkED(id, val){
    if(!val || confirm("Are you sure you want to perform this action?")){
      var ref = this.db.database.ref('/employees');
      ref.child(id).child('IsManagingDirector').set(!val);
      if(val){
        this.db.database.ref('/directors').child(id).remove();
        //this.db.database.ref('/employees').child(id).child('LineManagerID').remove();
        ref.orderByChild('ManagingDirectorID').equalTo(id)
          .once('value').then(function(snapshot){
            snapshot.forEach(function(childSnapshot) {
              ref.child(childSnapshot.key).child('IsManagingDirectorAssigned').set(false);
              ref.child(childSnapshot.key).child('ManagingDirectorID').remove();
              ref.child(childSnapshot.key).child('ManagingDirectorValue').remove();
          });
        });
      }
    }
  }

  RemoveManager(id){
    if(confirm("Are you sure you want to remove this managee?")){
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

  GetManagers(id){
    this.managers = this.db.list('employees', i => i.orderByChild('ManagingDirectorID').equalTo(id))
      .snapshotChanges().pipe(map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByName)
      ));
  }

}
