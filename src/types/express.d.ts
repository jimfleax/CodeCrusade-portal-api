import { IStaffUser } from '../models/StaffUser';

declare global {
  namespace Express {
    interface Request {
      user: IStaffUser;
    }
  }
}
