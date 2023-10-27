
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {
  constructor(private modalService: NzModalService, private zone: NgZone, private store: Store) {}

  public handleError(error: Error | HttpErrorResponse): void {
    return error instanceof HttpErrorResponse ? this.handleHttpError(error) : this.handleInternalError(error);
  }

  private handleHttpError(errorResponse: HttpErrorResponse, display = true): void {
    if (this.store.selectSnapshot(SharedState.config).SENTRY_DSN) {
      this.zone.runOutsideAngular(() =>
        Sentry.captureException(
          new URIError(
            `${errorResponse.status} - ${errorResponse.url} \n ${JSON.stringify(
              errorResponse.error,
              getCircularReplacer(),
              4
            )}`
          )
        )
      );
    }
    if (display) {
      this.openErrorModal(errorResponse.error);
    }
  }

  private handleInternalError(error: Error): void {
    if (!environment.production) {
      console.error(error);
    }
    if (this.store.selectSnapshot(SharedState.config).SENTRY_DSN) {
      this.zone.runOutsideAngular(() => Sentry.captureException(error));
    }
  }

  public openErrorModal(error: Error): void {
    this.modalService.create({
      nzStyle: { margin: '20px auto 0' },
      nzContent: ErrorModalComponent,
      nzComponentParams: {
        error,
      },
      nzWidth: 660,
      nzBodyStyle: { padding: '0px' },
      nzFooter: null,
      nzClosable: false,
    });
  }
}
