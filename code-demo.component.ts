
@Component({
  selector: 'comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class Comp implements OnInit {
  public currentStepIdx = 0;
  @Select(SharedState.details) public details$: Observable<OrganizationModel>;
  @Select(SharedState.genericDetails) public genericDetails$: Observable<GenericOrganizationModel>;
  @Select(RenewalSubscriptionState.isRSLoading) public isRSLoading$: Observable<boolean>;
  @Select(RenewalSubscriptionState.isPricingLoading) public isPricingLoading$: Observable<boolean>;
  @Select(RenewalSubscriptionState.isInvoiceLoading) public isInvoiceLoading$: Observable<boolean>;
  @Select(RenewalSubscriptionState.invoice) public paymentInvoice$: Observable<PaymentInvoice>;
  @Select(RenewalSubscriptionQueries.total) public total$: Observable<TotalCalculatedPricing>;
  @Select(RenewalSubscriptionQueries.data)
  public data$: Observable<ProductPricing[]>;
  @Select(RenewalSubscriptionState.paymentMethod) public paymentMethod$: Observable<PaymentMethod>;

  public applicationLoading$: Observable<boolean>;

  constructor(
    private translateService: TranslateService,
    private store: Store,
    private destroy$: DestroyService,
    private actions$: Actions,
    private cdRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.applicationLoading$ = combineLatest([this.isRSLoading$, this.isInvoiceLoading$]).pipe(
      map(([isRSLoading, isInvoiceLoading]) => isRSLoading || isInvoiceLoading)
    );

    this.store.dispatch([new RSLoadSubscriptionData(), new RSLoadInvoice()]);

    this.actions$
      .pipe(
        ofActionCompleted(RSLoadInvoice),
        take(1),
        switchMap(() => this.paymentInvoice$)
      )
      .subscribe(invoice => {
        if (this.hasOpenedInvoice(invoice)) {
          this.currentStepIdx = 1;
        }
      });

    this.actions$.pipe(ofActionSuccessful(RSProceedToPayment), takeUntil(this.destroy$)).subscribe(() => {
      this.store.dispatch(new MIXPANEL_RSContinueWithPayment());
      this.store.dispatch(new RSLoadInvoice());
      this.handleStepChange(1);
    });
  }

  public steps: AntStepModel[] = [
    { id: 1, title: this.translateService.instant('RENEWALS.SUBSCRIPTION.Subscription Details') },
    { id: 2, title: this.translateService.instant('RENEWALS.SUBSCRIPTION.Payment Information') },
  ];

  public handleStepChange(stepIdx: number): void {
    this.currentStepIdx = stepIdx;
    if (this.currentStepIdx === 0) {
      this.store.dispatch(new RSLoadData());
    }
    this.cdRef.detectChanges();
  }

  public handleProceedToPayment(data: ProductPricing[]): void {
    this.store.dispatch(new RSProceedToPayment(data));
  }

  public hasOpenedInvoice(invoice: PaymentInvoice): boolean {
    return (
      Boolean(invoice) &&
      invoice.issuer === InvoiceIssuer.User &&
      [InvoiceStatus.Draft, InvoiceStatus.Open].includes(invoice.status)
    );
  }
}
