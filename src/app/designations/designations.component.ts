import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';

@Component({
  selector: 'app-designations',
  templateUrl: './designations.component.html',
  styleUrls: ['./designations.component.scss'],
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
export class DesignationsComponent implements OnInit {

  designations: Observable<any[]>;
  desigValue = '';
  count = 0;

  constructor(public db: AngularFireDatabase) { }

  ngOnInit() {
    this.designations = this.db.list('designations').snapshotChanges();
    this.getCount();
    this.designations.subscribe(ref=>{console.log(ref[0])});
  }

  onSubmit() {
    if(this.desigValue.trim().length > 0){
    this.db.database.ref('designations').child(this.count.toString()).set(this.desigValue).then(t=>{
      this.desigValue = '';
      this.getCount();
      alert('Designation added successfully.');
    });
    }
  }

  getCount(){
    this.db.object('designations').valueChanges().subscribe(ref=> {this.count = ++Object.keys(ref).length});
  }

  RemoveDesignation(id){
    console.log(id)
    this.db.database.ref('employees').orderByChild('DesignationKey').equalTo(id)
      .once('value').then((snapshot) => {
        if(snapshot.exists()){
          alert('Cannot delete the designation as selected designation is mapped to employees.');
        }
        else{
          if(confirm('Are you sure you want to delete this designation?')){
            this.db.database.ref('designations').child(id).remove().then(a=>{
              this.getCount();
            });
          }
        }
      });
    
  }
}
