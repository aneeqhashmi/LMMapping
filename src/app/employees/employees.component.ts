import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';
import { filter, map } from 'rxjs/operators';

//import { XLSX$Utils } from 'xlsx';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
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

export class EmployeesComponent implements OnInit {

  employees: Observable<any[]>;
  employeesActualList: Observable<any[]>;
  designations: {}[];
  data: {}[];
  range: XLSX.Range;

  constructor(public db: AngularFireDatabase) {
  }

  ngOnInit(){
    this.employees = this.db.list('employees', ref=> ref.orderByChild('FullName')).snapshotChanges();
    this.employeesActualList = this.employees;

    this.db.list('designations').snapshotChanges().pipe(map(changes =>
      changes.map(c => ({ key: c.payload.key, value: c.payload.val() }))
    )).subscribe((designations) => {
      this.designations = designations;
    });
  }

  FilterList(val){
    this.employees= this.employeesActualList;
    val = val.trim().toLowerCase();

    if(val!= ''){
      this.employees = this.employees.pipe(map(employees => 
        employees.filter(emp => emp.payload.val().FullName.toLowerCase().includes(val))
      ));
      //this.employees.subscribe(ref=>{console.log(ref)})
    }
  }

  GetUnAssignedList(flag){
    this.employees= this.employeesActualList;
    if(flag){
      this.employees = this.employees.pipe(map(employees => 
        employees.filter(emp => !emp.payload.val().IsLineManagerAssigned)
      ));
    }
  }

  RemoveEmployee(id, lmid){
    if(confirm("Are you sure to delete this employee?")) {
      var ref= this.db.database.ref('/employees');
      ref.child(id).remove();
      this.db.database.ref('/line-managers').child(id).remove();
      this.db.database.ref('/line-managers').child(lmid).child(id).remove();
      this.db.database.ref('/employees').orderByChild('LineManagerID').equalTo(id).once('value')
        .then(function(snapshot){
        snapshot.forEach(function(childSnapshot) {
          ref.child(childSnapshot.key).child('IsLineManagerAssigned').set(false);
          ref.child(childSnapshot.key).child('LineManagerID').remove();
          ref.child(childSnapshot.key).child('LineManagerValue').remove();
          ref.child(childSnapshot.key).child('ManagingDirectorID').remove();
          ref.child(childSnapshot.key).child('ManagingDirectorValue').remove();
        });
      });
    }
  }

  MarkUnmarkLM(id, val){
    if(!val || confirm("Are you sure you want to remove this LM?")) {
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
  
  onFileChange(evt: any) {
    
    //wire up file reader 
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      //read workbook 
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      // grab first sheet
      const wsname: string = wb.SheetNames[2];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // save data
      this.data = (XLSX.utils.sheet_to_json(ws, {header: 1}));
     this.range = XLSX.utils.decode_range(ws['!ref']);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  ImportData(){
    console.log(this.data);

    for (let row = 1; row < this.data.length; row++) {
      
      var desigDirKey = this.designations.filter((item) => { 
        return item['value'].toLowerCase() === this.data[row][14].toLowerCase(); 
      });

      var desigLMKey = this.designations.filter((item) => { 
        return item['value'].toLowerCase() === this.data[row][9].toLowerCase(); 
      });
     
      var desigEmpKey = this.designations.filter((item) => { 
        return item['value'].toLowerCase() === this.data[row][2].toLowerCase(); 
      });
      
      //console.log(this.data[row]);
      if(desigEmpKey[0] == undefined){
        desigEmpKey.push({key:'-', value: '-'});
      }
      if(desigLMKey[0] == undefined){
        desigLMKey.push({key:'-', value: '-'});
      }
      if(desigDirKey[0] == undefined){
        desigDirKey.push({key:'-', value: '-'});
      }

      var empPromise = this.addEmployee(this.data[row][0], this.data[row][1], this.data[row][3], desigEmpKey[0]['key'], 
        this.data[row][2], false, false, false, false);

      empPromise.then((values)=>{

        var testPromise = new Promise((resolve, reject) => {

          var empid = values['key'];
          var directorID = '0';
          var directorValue = '-';
          var lmID = '0';
          var lmValue = '-';
          var CEOID = '0';
          var CEOValue = '-';
  
          //check if director exists
          if(this.data[row][12] != 0) { 
            this.db.database.ref('employees').orderByChild('EmpID').equalTo(this.data[row][12])
              .once('value').then((snapshot) => {
              var dirPromise;
              if(snapshot.exists()) {
                dirPromise = new Promise((resolve, reject) => { 
                  var key = Object.keys(snapshot.val())[0];
                  if(!snapshot.child(key).val().IsManagingDirector)
                    this.db.object('employees/' + key).update({ 'IsManagingDirector': true });
                  
                  resolve({key: key, 
                    value: snapshot.child(Object.keys(snapshot.val())[0]).val().FullName});
                });
                //directorID = Object.keys(snapshot.val())[0]; //snapshot.child(Object.keys(snapshot.val())[0]).val().EmpID;
              }
              else{
                dirPromise = this.addEmployee(this.data[row][12], this.data[row][13], this.data[row][15], desigDirKey[0]['key'], 
                  this.data[row][14], true, false, true, false);
              }

              dirPromise.then((dirValues )=>{
                directorID = dirValues['key'];
                directorValue = dirValues['value'];

                if(this.data[row][12] == 140){
                  CEOID = directorID;
                  CEOValue = directorValue;
                }

                //check if line manager exists
                if(this.data[row][7] != 0) {
                  this.db.database.ref('employees').orderByChild('EmpID').equalTo(this.data[row][7])
                  .once('value').then((snapshot) => {
                    var lmPromise;// = new Promise((resolve, reject) => { resolve();});
                    if(snapshot.exists()){
                      lmPromise = new Promise((resolve, reject) => { 
                        var key = Object.keys(snapshot.val())[0];
                        if(!snapshot.child(key).val().IsLineManager)
                          this.db.object('employees/' + key).update({ 'IsLineManager': true });
                        
                        resolve({key:key, 
                          value: snapshot.child(Object.keys(snapshot.val())[0]).val().FullName});
                      });
                      //lmID = Object.keys(snapshot.val())[0]; //snapshot.child(Object.keys(snapshot.val())[0]).val().EmpID;
                    }
                    else{
                      lmPromise = this.addEmployee(this.data[row][7], this.data[row][8], this.data[row][10], desigLMKey[0]['key'], 
                        this.data[row][9], true, false, false, false);
                    }

                    lmPromise.then((lmValues )=>{
                      lmID = lmValues['key'];
                      lmValue = lmValues['value'];

                      if(this.data[row][9] == 140){
                        CEOID = lmID;
                        CEOValue = lmValue;
                      }

                      if(directorID != '0'){
                        
                        if(this.data[row][0] == this.data[row][12]){
                          directorID = CEOID;
                          directorValue = CEOValue;
                        }

                        this.db.object('employees/' + lmID)
                          .update({ 'IsManagingDirectorAssigned': true, 'ManagingDirectorID':directorID, 'ManagingDirectorValue': directorValue });
                      }

                      if(lmID != '0'){
                        this.db.object('employees/' + empid)
                        .update({ 'IsLineManagerAssigned': true, 'LineManagerID':lmID, 'LineManagerValue': lmValue });
                      }
                    });
                  });
                }
              });
            });
          }
          else{
            //check if line manager exists
            if(this.data[row][7] != 0) {
              this.db.database.ref('employees').orderByChild('EmpID').equalTo(this.data[row][7])
              .once('value').then((snapshot) => {
                var lmPromise;// = new Promise((resolve, reject) => { resolve();});
                if(snapshot.exists()){
                  lmPromise = new Promise((resolve, reject) => { 
                    var key = Object.keys(snapshot.val())[0];
                    if(!snapshot.child(key).val().IsLineManager)
                      this.db.object('employees/' + key).update({ 'IsLineManager': true });
                    
                    resolve({key:key, 
                      value: snapshot.child(Object.keys(snapshot.val())[0]).val().FullName});
                  });
                  //lmID = Object.keys(snapshot.val())[0]; //snapshot.child(Object.keys(snapshot.val())[0]).val().EmpID;
                }
                else{
                  lmPromise = this.addEmployee(this.data[row][7], this.data[row][8], this.data[row][10], desigLMKey[0]['key'], 
                    this.data[row][9], true, false, false, false);
                }

                lmPromise.then((lmValues )=>{
                  lmID = lmValues['key'];
                  lmValue = lmValues['value'];

                  if(this.data[row][9] == 140){
                    CEOID = lmID;
                    CEOValue = lmValue;
                  }
                  
                  if(directorID != '0'){
                    
                    if(this.data[row][0] == this.data[row][12]){
                      directorID = CEOID;
                      directorValue = CEOValue;
                    }

                    this.db.object('employees/' + lmID)
                      .update({ 'IsManagingDirectorAssigned': true, 'ManagingDirectorID':directorID, 'ManagingDirectorValue': directorValue });
                  }

                  if(lmID != '0'){
                    this.db.object('employees/' + empid)
                    .update({ 'IsLineManagerAssigned': true, 'LineManagerID':lmID, 'LineManagerValue': lmValue });
                  }
                });
              });
            }
          }
          resolve();
        });

        testPromise.then(()=>{
        });
      });

    }
  }

  addEmployee(empIdValue, fnameValue, emailValue, designationKey, designationValue, isLMValue, 
    isLMAssignedValue, isMDValue, isMDAssignedValue){
      return new Promise((resolve, reject) => {
        //console.log('adding...');
        var emp = this.db.list('/employees').push({ EmpID: empIdValue, FullName: fnameValue,
        Email: emailValue, DesignationKey: designationKey, DesignationValue: designationValue, 
        IsLineManager: isLMValue, IsLineManagerAssigned: isLMAssignedValue, 
        IsManagingDirector: isMDValue, IsManagingDirectorAssigned: isMDAssignedValue,
        ManagingDirectorID:'0',LineManagerID:'0' });
        resolve({ key: emp.key, value:fnameValue });
    });
  }
}

