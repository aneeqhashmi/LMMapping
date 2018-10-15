import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { AngularFireAuth, AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {

  constructor(private afa: AngularFireAuth,
              private db: AngularFireDatabase,
              private router:Router) { }

  checkUser() {
    return this.afa.auth.currentUser == null;
  }

  emailSignUp(credentials: EmailPasswordCredentials){
    return this.afa.auth.createUserWithEmailAndPassword(credentials.email, credentials.password)
      .then(() => {
        console.log("success"); 
        this.router.navigate(['']);
      })
      .catch(error => alert(error));
  }
  
  emailLogin(credentials: EmailPasswordCredentials) {
      return this.afa.auth.signInWithEmailAndPassword(credentials.email, credentials.password)
        .then(() => {
          console.log("success"); 
          this.router.navigate(['']);
        }).catch(error => alert(error));
  }

  resetPassword(email: string) {
    return this.afa.auth
      .sendPasswordResetEmail(email)
      .then(() => alert('Password update email sent'))
      .catch(error => alert(error));
  }

  updateCurrentUser(value){
    return new Promise((resolve, reject) => {
        var user = this.afa.auth.currentUser;
        user.updateProfile({
          displayName: value.name,
          photoURL: user.photoURL
        }).then(() => { resolve() }, err => reject(err))
      });
  }

  signOut() {
    this.afa.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}

export class EmailPasswordCredentials {
  email: string;
  password: string;
}