
@Injectable({ providedIn: 'root' })
export class JwtService {
  constructor(private navService: NavigationService, private store: Store) {}
  private jwtHelper = new JwtHelperService();
  private _decodedToken: JwtModel;

  public setAndVerifyToken(token?: string): boolean {
    if (token) {
      try {
        this._decodedToken = this.jwtHelper.decodeToken(token);
        this.store.dispatch(new SetToken(token));
      } catch (e) {
        this.navService.navigateToXXX();
      }
    } else if (this.token) {
      this._decodedToken = this.jwtHelper.decodeToken(this.token);
    }
    return this.verifyToken();
  }

  private get isTokenExpired(): boolean {
    return Date.now() > this.decodedToken.exp * 1000;
  }

  private verifyToken(): boolean {
    if (!this.decodedToken || this.isTokenExpired) {
      this.navService.navigateXXX();
      return false;
    }
    return true;
  }

  public get decodedToken(): JwtModel {
    return this._decodedToken || this.jwtHelper.decodeToken(this.token);
  }

  public get userData(): JwtUserData {
    return {
      data1: this.decodedToken.data1,
      data2: this.decodedToken.data2,
    };
  }

  public get orgData(): JwtOrgData {
    return {
      org_id: this.decodedToken.orgs[0].id,
    };
  }

  public get userName(): string {
    return this.userData ? `${this.userData.data3} ${this.userData.data4}` : '';
  }

  public get token(): string {
    return this.store.selectSnapshot(AuthState.token);
  }
}
