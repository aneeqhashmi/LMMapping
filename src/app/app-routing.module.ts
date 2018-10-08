import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DesignationsComponent } from './designations/designations.component';
import { EmployeesComponent } from './employees/employees.component';
import { EmployeeDetailsComponent } from './employee-details/employee-details.component';
import { LineManagersComponent } from './line-managers/line-managers.component';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { DirectorsComponent } from './directors/directors.component';


const routes: Routes = [
  {
    path: '',
    component: EmployeesComponent
  },
  {
    path: 'employees/:id',
    component: EmployeeDetailsComponent
  },
  {
    path: 'linemanagers',
    component: LineManagersComponent
  },
  {
    path: 'linemanagers/:id',
    component: LineManagersComponent
  },
  {
    path: 'designations',
    component: DesignationsComponent
  },
  {
    path: 'add-employee',
    component: AddEmployeeComponent
  },
  {
    path: 'add-employee/:id',
    component: AddEmployeeComponent
  },
  {
    path: 'directors',
    component: DirectorsComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
