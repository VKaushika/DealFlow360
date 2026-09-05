import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { AuthRequest } from '../middleware/authMiddleware';

export class CustomerController {
  public static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, tier } = req.query;
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: String(search), $options: 'i' } },
          { companyName: { $regex: String(search), $options: 'i' } },
          { email: { $regex: String(search), $options: 'i' } },
          { code: { $regex: String(search), $options: 'i' } },
        ];
      }
      if (tier) query.tier = tier;

      const customers = await Customer.find(query).sort({ name: 1 }).populate('assignedSalesRepId', 'name email');
      res.json({ success: true, count: customers.length, data: customers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customer = await Customer.findById(req.params.id).populate('assignedSalesRepId', 'name email');
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }
      res.json({ success: true, data: customer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, phone, companyName, tier, industry, creditLimit, address } = req.body;
      const code = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

      const customer = await Customer.create({
        name,
        code,
        email: email.toLowerCase(),
        phone: phone || '',
        companyName: companyName || name,
        tier: tier || 'BRONZE',
        industry: industry || 'Technology',
        creditLimit: creditLimit || 500000,
        address: address || {},
        assignedSalesRepId: req.user?.id || null,
      });

      res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }
      res.json({ success: true, data: customer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customer = await Customer.findByIdAndDelete(req.params.id);
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }
      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
