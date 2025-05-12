class PathURL {
  static readonly login = 'login';

  static readonly dashboard = '';

  static readonly report = 'report';
  
  static readonly statistic = '';

  static readonly drinks = 'drinks';
  
  static readonly balls = 'balls';

  static readonly tournaments = 'tournaments';

  static readonly schedules = 'schedules';

  static readonly sportEquipments = 'sport-equipments';

  static readonly coaches = 'coaches';

  static readonly rackets = 'rackets';

  static readonly courtPrices = 'court-prices';

  static readonly courtPricesAddEdit = `${this.courtPrices}/add`;

  static readonly courtPricesEdit = `${this.courtPrices}/edit/:id`;

  static readonly courtPricesDetail = `${this.courtPrices}/:id`;

  static readonly courtStatus = 'court-status';

  static readonly profile = 'profile';

  static readonly pageNotFound = '404';

  static readonly setting = 'setting';

  static readonly partners = 'partners';
  
  static readonly addPartners = `${this.partners}/add`;

  static readonly editPartners = `${this.partners}/edit/:id`;

  static readonly detailPartners = `${this.partners}/:id`;

  static readonly orders = 'orders';

  static readonly transactions = 'transactions';

  static readonly permission = 'permission';

  static readonly role = 'role';

  static readonly courtServices = 'court-services';

  static readonly courtImages = 'court-images';

  static readonly sells = 'sells';

  static readonly analysis = 'analysis';

  static readonly schedule = '/schedule/:id';

  static readonly schedule_auto = '/schedule-auto/:id';

  static readonly checkout = '/checkout';

  static readonly payment = '/payment';

  static readonly checkout_schedule_auto = '/checkout-schedule-auto';

  static readonly payment_schedule_auto = '/payment-schedule-auto';

  static readonly booking = 'booking';

  static readonly staff_management = 'staff';

  static readonly addStaff = `${this.staff_management}/add`;

  static readonly editStaff = `${this.staff_management}/edit/:id`;

  static readonly detailStaff = `${this.staff_management}/:id`;

  static readonly staff_order_booking_date = 'staff-order-booking-date';

  static readonly staffOrder = 'staff-order-service';
}

export default PathURL;
