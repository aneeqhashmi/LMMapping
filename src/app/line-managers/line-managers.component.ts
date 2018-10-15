import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  designations: Observable<any[]>;
  manageesList: {} = {};
  manageesCount: {} = {};
  lmCount:number = 0;
  managersActualList: Observable<any[]>;
  sortByProperty:string = 'FullName';
  filterByText:string = '';
  designationKey: string = '0';

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() { 
    this.loadData();
    this.managersActualList = this.managers;
    this.designations = this.db.list('designations').snapshotChanges().pipe(map(changes =>{
      return changes.map(c => ({ key: c.payload.key, value: c.payload.val() })).sort(this.SortByProperty('value'))
    }));

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
    //this.managers.subscribe(ref=>{console.log(ref)});
  }

  loadData(){
    var temp = this.db.list('employees', 
    ref => ref.orderByChild('IsLineManager').equalTo(true)).snapshotChanges().pipe(map(changes =>{
      //console.log('fetching')
      if(this.lmCount == 0 || this.lmCount < changes.length)
        this.lmCount = changes.length;
      return changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty(this.sortByProperty))
    }));

    this.managers = temp.pipe(map(employees => {
      employees.forEach(item=>{
        //console.log('in promise of for each of managers.')
        
        var prom = new Promise((resolve, reject) => {
          this.db.list('/employees', ref => ref.orderByChild('LineManagerID').equalTo(item.key))
          .snapshotChanges().subscribe(sub=>{
            var mdPromise = new Promise((resolve, reject) => {
              var mdid = '0', mdvalue = '';
              if(item['IsLineManagerAssigned'] && !item['IsManagingDirectorAssigned']){
                this.db.database.ref('employees').child(item['LineManagerID']).once('value').then((lm)=>{
                  mdid = lm.val().ManagingDirectorID;
                  mdvalue = lm.val().ManagingDirectorValue;
                  resolve({mdid: mdid, mdvalue:mdvalue});
                });
              }
              else{
                resolve({mdid: mdid, mdvalue:mdvalue});
              }
            });
            mdPromise.then((md)=>{
              resolve({count:sub.length, mdid: md['mdid'], mdvalue:md['mdvalue']});
            });
          });
        });
        prom.then((res)=>{
          this.manageesCount[item.key] = res["count"];
          if(res['mdid'] != '0'){
            item['ManagingDirectorID'] = res['mdid'];
            item['ManagingDirectorValue'] = res['mdvalue'];
          }
        });
      });
      return employees;
    }));
    //managersTemp.subscribe(ref=>{console.log(ref)});
  }

  loadLMCount(lmid){
    this.db.list('/employees', ref => ref.orderByChild('LineManagerID').equalTo(lmid))
          .snapshotChanges().subscribe(sub=>{
          this.manageesCount[lmid] = sub.length;
      });
  }

  SortData(val) {
    this.sortByProperty = val;
    //console.log('sorting...')
    this.managers = this.managers.pipe(map(employees => 
      employees.sort(this.SortByProperty(val))
    ));
  }

  SortByProperty(prop){
    return function (x, y) {
      return ((x[prop] == y[prop]) ? 0 : ((x[prop] > y[prop]) ? 1 : -1));
    };
  }

  FilterList(val){
    this.managers= this.managersActualList;
    val = val.trim().toLowerCase();
    this.filterByText = val;

    if(val != '' || this.designationKey != '0'){
      this.managers = this.managers.pipe(map(employees => {
        var fil = employees;
        if(val != '')
          fil = fil.filter(emp => emp.FullName.toLowerCase().includes(val));
        if(this.designationKey != '0'){
          fil = fil.filter(emp => emp.DesignationKey == this.designationKey);
        }
        this.lmCount = fil.length;
        return fil;
      }));
      //this.employees.subscribe(ref=>{console.log(ref)})
    }
  }

  FilterByDesig(desigKey){
    this.managers= this.managersActualList;
    if(desigKey != '0'){
      this.managers = this.managers.pipe(map(employees => {
        var fil = employees.filter(emp => emp.DesignationKey == desigKey);
        this.lmCount = fil.length;
        return fil;
      }));
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

      this.db.object('/employees/' + id + '/LineManagerID').valueChanges().subscribe(obj =>{
        var lmid = obj as string;
        ref.child(id).child('IsLineManagerAssigned').set(false);
        ref.child(id).child('LineManagerID').remove();
        ref.child(id).child('LineManagerValue').remove();
        this.db.database.ref('/line-managers').child(lmid).child(id).remove();
        this.loadLMCount(lmid);
      });
    }
  }

  GetManagees(id){
    if(this.manageesList[id] == undefined){
      this.db.list('employees', i => i.orderByChild('LineManagerID').equalTo(id))
      .snapshotChanges().pipe(map(changes =>
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() })).sort(this.SortByProperty(this.sortByProperty))
      )).subscribe(s=>{
        this.manageesList[id] = s;
      });
    }
    else{
      this.manageesList[id] = undefined;
    }
  }

  onDrop(dropData, lmid, lmValue) {
    dropData = JSON.parse(dropData.dropData);
    if(confirm('Are you sure you want to assign ' + lmValue 
      + ' as the Line Manager of ' + dropData.FullName + '?')){
      this.db.database.ref('/line-managers').child(lmid).child(dropData.key).set(true);
      this.db.database.ref('/employees').child(dropData.key).update({
        'IsLineManagerAssigned': true, 'LineManagerID' : lmid, 'LineManagerValue': lmValue
      });
      alert('Line Manager assigned.');
      this.loadLMCount(lmid);
    }
  }
}
