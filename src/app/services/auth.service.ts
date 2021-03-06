import { User } from "./../models/user.model";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, from } from "rxjs";
import { environment } from "../../environments/environment";
import { map, tap } from "rxjs/operators";
import { Plugins } from "@capacitor/core";

interface AuthResponse {
  user: User;
  access_token: string;
  expires_at: Date;
  token_type: string;
}

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private _user = new BehaviorSubject<User>(null);

  get isAuthenticated() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) return !!user.token;
        return false;
      })
    );
  }

  get userId() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) return user.id;
        return null;
      })
    );
  }

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}login`, { email, password })
      .pipe(tap(userData => this.setUser(userData)));
  }

  signup(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}register`, {
        name,
        email,
        password
      })
      .pipe(tap(userData => this.setUser(userData)));
  }

  getUser() {
    return this._user;
  }

  setUser(userData: AuthResponse) {
    console.log(userData);

    let user = new User(
      userData.user.id,
      userData.access_token,
      userData.expires_at
    );
    user.name = userData.user.name;
    user.email = userData.user.email;
    user.avatar = userData.user.avatar;
    this._user.next(user);
    this.storeAuthData(user);
  }

  autoLogin() {
    return from(Plugins.Storage.get({ key: "auth" })).pipe(
      map(data => {
        if (!data || !data.value) return null;
        const parsedData = JSON.parse(data.value) as { user: User };
        return parsedData.user;
      }),
      tap(user => {
        if (user) {
          this._user.next(user);
        }
      }),
      map(user => {
        return !!user;
      })
    );
  }

  logout() {
    this._user.next(null);
    Plugins.Storage.remove({ key: "auth" });
  }

  private storeAuthData(user: User) {
    let data = JSON.stringify({ user });
    Plugins.Storage.set({ key: "auth", value: data });
  }
}
