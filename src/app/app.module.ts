import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';

import { AngularFireModule } from 'angularfire2';

import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule  } from 'angularfire2/auth';

import { EmployeesComponent } from './employees/employees.component';
import { DesignationsComponent } from './designations/designations.component';
import { LineManagersComponent } from './line-managers/line-managers.component';
import { EmployeeDetailsComponent } from './employee-details/employee-details.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { DirectorsComponent } from './directors/directors.component';
import { LoginComponent } from './login/login.component';

import { DragAndDropModule } from 'angular-draggable-droppable';
import { RecentlyAddedComponent } from './recently-added/recently-added.component';
import {DataTableModule} from "angular-6-datatable";

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    EmployeesComponent,
    DesignationsComponent,
    LineManagersComponent,
    EmployeeDetailsComponent,
    AddEmployeeComponent,
    DirectorsComponent,
    LoginComponent,
    RecentlyAddedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule, // for database,
    AngularFireAuthModule,
    BrowserAnimationsModule,
    DragAndDropModule,
    DataTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
