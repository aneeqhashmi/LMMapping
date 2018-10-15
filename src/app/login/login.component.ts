import { Component, OnInit } from '@angular/core';
import { FirebaseAuthService, EmailPasswordCredentials } from "../firebase-auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  errorMessage: string = '';
  email:string = '';
  password:string = '';
  credentials: EmailPasswordCredentials;

  constructor(private auth: FirebaseAuthService) {
    this.credentials = new EmailPasswordCredentials();
   }

  ngOnInit() {
  }

  onSignUp(){
    if(this.email.trim().length > 0 && this.password.trim().length > 0){
      this.credentials.email = this.email;
      this.credentials.password = this.password;
      this.auth.emailSignUp(this.credentials);
    }
  }

  onLogin(){
    if(this.email.trim().length > 0 && this.password.trim().length > 0){
      this.credentials.email = this.email;
      this.credentials.password = this.password;
      this.auth.emailLogin(this.credentials);
    }
  }

}
