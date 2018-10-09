import { Component, OnInit } from '@angular/core';
//import { AngularFire, FirebaseListObservable } from 'angularfire2';
import { AngularFireDatabase, AngularFireList  } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.scss']
})
export class AddEmployeeComponent implements OnInit {

  lineManagers: Observable<any[]>;
  designations: Observable<any[]>;
  directors: Observable<any[]>;
  emp: Observable<any>;
  empIdExists = false;
  Message = '';
  Title = 'Add employee';

  empIdValue = '';
  fnameValue = '';
  emailValue = '';
  designationKey = '0';
  designationValue = '';
  //genderValue = '0';
  isLMValue = false;
  isOldLMValue = false;
  LMKey = '0';
  LMValue = '';
  OldLMKey = '0';
  isMDValue = false;
  isOldMDValue = false;
  MDKey = '0';
  MDValue = '';
  OldMDKey = '0';
  emp$: Object = '0';
  
  constructor(private route: ActivatedRoute, public db: AngularFireDatabase, private router: Router) { 
    this.clearModel();
    this.route.params.subscribe(params =>  this.emp$ = params.id ? params.id : '0');
  }
  
  ngOnInit() {
    if(this.emp$ != '0'){
      this.Title = 'Edit employee';
      this.emp = this.db.object('employees/' + this.emp$).valueChanges();

      this.emp.subscribe(ref=>{
        this.empIdValue = ref.EmpID;
        this.fnameValue = ref.FullName;
        //this.lnameValue = ref.LastName;
        this.emailValue = ref.Email;
        this.designationKey = ref.DesignationKey;
        this.designationValue = ref.DesignationValue;
        //this.genderValue = ref.Gender;
        this.isLMValue = ref.IsLineManager || false;
        this.isOldLMValue = ref.IsLineManager || false;
        this.LMKey = ref.LineManagerID || '0';
        this.LMValue = ref.LineManagerValue || '';
        this.OldLMKey = ref.LineManagerID || '0';

        this.isMDValue = ref.IsManagingDirector || false;
        this.isOldMDValue = ref.IsManagingDirector || false;
        this.MDKey = ref.ManagingDirectorID || '0';
        this.MDValue = ref.ManagingDirectorValue || '';
        this.OldMDKey = ref.ManagingDirectorID || '0';
      });
    }
    this.lineManagers = this.db.list('employees', ref => ref.orderByChild('IsLineManager').equalTo(true)).snapshotChanges();
    this.designations = this.db.list('designations').snapshotChanges();
    this.directors = this.db.list('employees', ref => ref.orderByChild('IsManagingDirector').equalTo(true)).snapshotChanges();
    //this.lineManagers.subscribe(ref=>{console.log(ref[0].payload.val())});
  }

  onEmpIDChange(val){
    val = val.trim();
    console.log(val);
    if(val.length > 0){
      this.db.database.ref('employees').orderByChild('EmpID').equalTo(val)
      .once('value').then((snapshot) => {
        this.empIdExists = snapshot.exists();
      });
    }
    else
      this.empIdExists = false;
  }

  DesignationChanged(event){
    //console.log(event);
    this.designationKey = event.target.value;
    this.designationValue = event.target.options[event.target.selectedIndex].label;
  }

  LineManagerChanged(event){
    //console.log(event);
    this.LMKey = event.target.value;
    this.LMValue = event.target.options[event.target.selectedIndex].label;
  }

  MDChanged(event){
    this.MDKey = event.target.value;
    this.MDValue = event.target.options[event.target.selectedIndex].label;
  }

  onSubmit() {
    if(this.empIdExists && this.emp$ == '0'){
      return;
    }
    else{
      var isLMAssignedValue = (this.LMKey != "0" && this.LMKey != undefined);
      var isMDAssignedValue = (this.MDKey != "0");

      if(this.emp$ == '0'){
        this.emp$ = this.db.list('/employees').push({ EmpID: this.empIdValue, FullName: this.fnameValue,
          Email: this.emailValue, DesignationKey: this.designationKey, DesignationValue: this.designationValue, /*Gender: this.genderValue,*/
          IsLineManager: this.isLMValue, IsLineManagerAssigned: isLMAssignedValue, 
          IsManagingDirector: this.isMDValue, IsManagingDirectorAssigned: isMDAssignedValue }).key;
          
        this.Message = "Record saved successfully.";
      }
      else{
        this.db.database.ref('/employees/' + this.emp$).update({ EmpID: this.empIdValue, FullName: this.fnameValue,
          Email: this.emailValue, DesignationKey: this.designationKey, DesignationValue: this.designationValue, /*Gender: this.genderValue,*/
          IsLineManager: this.isLMValue, IsLineManagerAssigned: isLMAssignedValue,
          IsManagingDirector: this.isMDValue, IsManagingDirectorAssigned: isMDAssignedValue });
        
        this.Message = "Record updated successfully.";
      }

      if(this.isOldLMValue && !this.isLMValue){
        var ref = this.db.database.ref('/employees');
        this.db.database.ref('/line-managers').child(this.emp$ as string).remove();
        ref.orderByChild('LineManagerID').equalTo(this.emp$ as string)
          .once('value').then(function(snapshot){
            snapshot.forEach(function(childSnapshot) {
              ref.child(childSnapshot.key).child('IsLineManagerAssigned').set(false);
              ref.child(childSnapshot.key).child('LineManagerID').remove();
          });
        });
      }

      if(this.isOldMDValue && !this.isMDValue) {
        var ref = this.db.database.ref('/employees');
        this.db.database.ref('/directors').child(this.emp$ as string).remove();
        ref.orderByChild('ManagingDirectorID').equalTo(this.emp$ as string)
          .once('value').then(function(snapshot){
            snapshot.forEach(function(childSnapshot) {
              ref.child(childSnapshot.key).child('IsManagingDirectorAssigned').set(false);
              ref.child(childSnapshot.key).child('ManagingDirectorID').remove();
          });
        });
      }

      if(isLMAssignedValue){
        this.db.database.ref('/line-managers').child(this.LMKey).child(this.emp$ as string).set(true);
        this.db.database.ref('/employees').child(this.emp$ as string).child('LineManagerID').set(this.LMKey);
        this.db.database.ref('/employees').child(this.emp$ as string).child('LineManagerValue').set(this.LMValue);
      }
      else{
        this.db.database.ref('/employees').child(this.emp$ as string).child('LineManagerID').remove();
        this.db.database.ref('/employees').child(this.emp$ as string).child('LineManagerValue').remove();
        if(this.OldLMKey!= '0')
          this.db.database.ref('/line-managers').child(this.OldLMKey).child(this.emp$ as string).remove();
      }

      if(isMDAssignedValue){
        this.db.database.ref('/directors').child(this.MDKey).child(this.emp$ as string).set(true);
        this.db.database.ref('/employees').child(this.emp$ as string).child('ManagingDirectorID').set(this.MDKey);
        this.db.database.ref('/employees').child(this.emp$ as string).child('ManagingDirectorValue').set(this.MDValue);
      }
      else{
        this.db.database.ref('/employees').child(this.emp$ as string).child('ManagingDirectorID').remove();
        this.db.database.ref('/employees').child(this.emp$ as string).child('ManagingDirectorValue').remove();
        if(this.OldMDKey!= '0')
          this.db.database.ref('/directors').child(this.OldMDKey).child(this.emp$ as string).remove();
      }
      this.clearModel();
      setTimeout(() => { this.router.navigate(['/add-employee']); this.Message = ''; }, 1500);
    }
  }

  clearModel(){
    
    this.empIdExists = false;
    this.empIdValue = '';
    this.fnameValue = '';
    this.emailValue = '';
    this.designationKey = '0';
    this.designationValue = '';
    //this.genderValue = '0';
    this.isLMValue = false;
    this.isOldLMValue = false;
    this.LMKey = '0';
    this.LMValue = '';
    this.OldLMKey = '0';
    this.isMDValue = false;
    this.isOldMDValue = false;
    this.MDKey = '0';
    this.MDValue = '';
    this.OldMDKey = '0';
    this.designations = this.designations;
  }

  CancelSave(){
    this.router.navigate(['/']);
  }
}
