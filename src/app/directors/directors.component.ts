import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList, snapshotChanges } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';

@Component({
  selector: 'app-directors',
  templateUrl: './directors.component.html',
  styleUrls: ['./directors.component.scss']
})
export class DirectorsComponent implements OnInit {

  directors: any[] = [];
  designations: Observable<any[]>;
  managersList: {} = {};
  directorsActualList: any[]
  designationKey: string = '0';

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() {
    this.loadData();
    this.designations = this.db.list('designations').snapshotChanges().pipe(map(changes =>{
      return changes.map(c => ({ key: c.payload.key, value: c.payload.val() })).sort(this.SortByProperty('value'))
    }));
  }

  loadData(){
    var temp = this.db.list('employees', ref => ref.orderByChild('IsManagingDirector').equalTo(true))
      .snapshotChanges().pipe(map(changes => 
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty('FullName'))
    ));

    temp.subscribe(s=>{
      this.directors = s as any[];
      this.directorsActualList = this.directors;

      this.directors.map(item=>{
        //console.log('in promise of for each of directors.')
          
        var prom = new Promise((resolve, reject) => {
          this.db.list('/employees', ref => ref.orderByChild('ManagingDirectorID').equalTo(item.key))
          .snapshotChanges().subscribe(sub=>{
            resolve({count:sub.length });
          });
        });
        prom.then((res)=>{
          item['LineManageesCount'] = res['count'];
        });
      });
    });
    //managersTemp.subscribe(ref=>{console.log(ref)});
  }

  SortByProperty(prop){
    return function (x, y) {
      return ((x[prop] == y[prop]) ? 0 : ((x[prop] > y[prop]) ? 1 : -1));
    };
  }

  FilterList(val){
    this.directors= this.directorsActualList;
    val = val.trim().toLowerCase();

    if(val != ''){
      this.directors = this.directors.filter(emp => (emp['FullName'] as string).toLowerCase().includes(val)) as any[];
    }
    if(this.designationKey != '0'){
      this.directors = this.directors.filter(emp => emp['DesignationKey'] == this.designationKey) as any[];
    }
  }

  FilterByDesig(desigKey){
    this.directors= this.directorsActualList;
    if(desigKey != '0'){
      this.directors = this.directors.filter(emp => emp['DesignationKey'] == this.designationKey) as any[];
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
    if(this.managersList[id] == undefined){
      this.db.list('employees', i => i.orderByChild('ManagingDirectorID').equalTo(id))
      .snapshotChanges().pipe(map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty('FullName'))
      )).subscribe(s=>{
        this.managersList[id] = s;
      });
    }
    else{
      this.managersList[id] = undefined;
    }
  }

}
