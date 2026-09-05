import { Fulfillment, IFulfillment } from '../models/Fulfillment';
import { Backorder, IBackorder } from '../models/Backorder';
import { Warehouse } from '../models/Warehouse';
import { WarehouseStock } from '../models/WarehouseStock';
import { Quotation, IQuotation } from '../models/Quotation';
import { AuditService } from './auditService';
import mongoose from 'mongoose';

export interface FulfillmentAllocationPlan {
  allocations: Array<{
    warehouseId: string;
    warehouseName: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
    }>;
    estimatedCost: number;
  }>;
  backorders: Array<{
    productId: string;
    productName: string;
    quantityBackordered: number;
    reason: string;
  }>;
  totalShipments: number;
  totalEstimatedCost: number;
  hasBackorders: boolean;
}

export class FulfillmentService {
  public static async calculateAllocationPlan(quotationId: string): Promise<FulfillmentAllocationPlan> {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    // Filter physical goods that require inventory
    const goodsItems = quotation.items.filter((item) => item.type === 'GOODS');
    const warehouses = await Warehouse.find({ isActive: true }).sort({ isDefault: -1 });

    const warehouseAllocationsMap = new Map<
      string,
      {
        warehouseId: string;
        warehouseName: string;
        shippingCostWeight: number;
        items: Array<{ productId: string; productName: string; quantity: number }>;
      }
    >();

    for (const wh of warehouses) {
      warehouseAllocationsMap.set(wh._id.toString(), {
        warehouseId: wh._id.toString(),
        warehouseName: wh.name,
        shippingCostWeight: wh.shippingCostWeight || 1.0,
        items: [],
      });
    }

    const backorders: Array<{
      productId: string;
      productName: string;
      quantityBackordered: number;
      reason: string;
    }> = [];

    for (const item of goodsItems) {
      let neededQty = item.quantity;

      // Query stock for this product across all warehouses
      const stocks = await WarehouseStock.find({
        productId: item.productId,
      }).populate('warehouseId');

      // Sort stocks: default warehouse first, then by highest available quantity
      stocks.sort((a, b) => {
        const whA = a.warehouseId as any;
        const whB = b.warehouseId as any;
        if (whA?.isDefault && !whB?.isDefault) return -1;
        if (!whA?.isDefault && whB?.isDefault) return 1;
        return b.quantityAvailable - a.quantityAvailable;
      });

      for (const stock of stocks) {
        if (neededQty <= 0) break;
        const wh = stock.warehouseId as any;
        if (!wh || !wh.isActive) continue;

        const available = Math.max(0, stock.quantityAvailable);
        if (available > 0) {
          const allocateQty = Math.min(neededQty, available);
          neededQty -= allocateQty;

          const allocEntry = warehouseAllocationsMap.get(wh._id.toString());
          if (allocEntry) {
            allocEntry.items.push({
              productId: item.productId.toString(),
              productName: item.productName,
              quantity: allocateQty,
            });
          }
        }
      }

      // If any quantity couldn't be fulfilled from current stock -> create backorder
      if (neededQty > 0) {
        backorders.push({
          productId: item.productId.toString(),
          productName: item.productName,
          quantityBackordered: neededQty,
          reason: `Insufficient inventory across all warehouses. Available stock depleted.`,
        });
      }
    }

    // Filter only warehouses that have allocated items
    const activeAllocations = Array.from(warehouseAllocationsMap.values())
      .filter((w) => w.items.length > 0)
      .map((w) => {
        const totalItemsCount = w.items.reduce((sum, i) => sum + i.quantity, 0);
        // Base shipment cost is ₹500 multiplied by weight factor and item quantity factor
        const estimatedCost = Math.round(500 * w.shippingCostWeight + totalItemsCount * 20);
        return {
          warehouseId: w.warehouseId,
          warehouseName: w.warehouseName,
          items: w.items,
          estimatedCost,
        };
      });

    const totalShipments = activeAllocations.length;
    const totalEstimatedCost = activeAllocations.reduce((acc, a) => acc + a.estimatedCost, 0);

    return {
      allocations: activeAllocations,
      backorders,
      totalShipments,
      totalEstimatedCost,
      hasBackorders: backorders.length > 0,
    };
  }

  public static async executeFulfillment(
    quotationId: string,
    overrideAllocations?: Array<{
      warehouseId: string;
      items: Array<{ productId: string; quantity: number }>;
    }>,
    userId?: string,
    userName: string = 'System'
  ): Promise<{ fulfillment: IFulfillment; backorders: IBackorder[] }> {
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    const plan = await this.calculateAllocationPlan(quotationId);
    const finalAllocations = overrideAllocations || plan.allocations;

    // Deduct available stock and add to reserved in database
    const shipmentRecords: any[] = [];
    for (const alloc of finalAllocations) {
      const wh = await Warehouse.findById(alloc.warehouseId);
      const whName = wh ? wh.name : 'Warehouse';
      const itemsList: any[] = [];

      for (const item of alloc.items) {
        const stock = await WarehouseStock.findOne({
          warehouseId: alloc.warehouseId,
          productId: item.productId,
        });

        if (stock) {
          if (stock.quantityAvailable < item.quantity) {
            throw new Error(
              `Insufficient stock in ${whName} for product ID ${item.productId}. Available: ${stock.quantityAvailable}, Requested: ${item.quantity}`
            );
          }
          stock.quantityReserved += item.quantity;
          stock.quantityAvailable = Math.max(0, stock.quantityOnHand - stock.quantityReserved);
          await stock.save();
        }

        const prod = quotation.items.find((i) => i.productId.toString() === item.productId.toString());
        itemsList.push({
          productId: item.productId,
          productName: prod ? prod.productName : 'Product',
          quantity: item.quantity,
        });
      }

      shipmentRecords.push({
        warehouseId: alloc.warehouseId,
        warehouseName: whName,
        items: itemsList,
        status: 'ALLOCATED',
        trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        estimatedCost: (alloc as any).estimatedCost || 500,
        dispatchedAt: new Date(),
      });
    }

    // Persist Fulfillment Record
    const fulfillment = await Fulfillment.create({
      quotationId: quotation._id,
      customerId: quotation.customerId,
      status: plan.hasBackorders ? 'PARTIALLY_SHIPPED' : 'FULFILLED',
      allocations: shipmentRecords,
      totalShipments: shipmentRecords.length,
      totalEstimatedCost: plan.totalEstimatedCost,
      hasBackorders: plan.hasBackorders,
      allocatedBy: userId ? new mongoose.Types.ObjectId(userId) : null,
      allocatedAt: new Date(),
      completedAt: plan.hasBackorders ? null : new Date(),
    });

    // Create Backorder Records if needed
    const createdBackorders: IBackorder[] = [];
    if (plan.hasBackorders) {
      for (const bo of plan.backorders) {
        const backorderRecord = await Backorder.create({
          backorderNumber: `BO-${Date.now().toString().slice(-6)}`,
          quotationId: quotation._id,
          customerId: quotation.customerId,
          productId: bo.productId,
          productName: bo.productName,
          quantityBackordered: bo.quantityBackordered,
          quantityFulfilled: 0,
          status: 'OPEN',
          notes: bo.reason,
        });
        createdBackorders.push(backorderRecord);
      }
    }

    quotation.stage = plan.hasBackorders ? 'FULFILLMENT_IN_PROGRESS' : 'FULFILLED';
    await quotation.save();

    await AuditService.log({
      actorId: userId,
      actorName: userName,
      actorRole: 'FINANCE_OPS',
      action: 'FULFILLMENT_ALLOCATED',
      entityType: 'FULFILLMENT',
      entityId: fulfillment._id.toString(),
      entityNumber: quotation.quoteNumber,
      afterState: {
        totalShipments: shipmentRecords.length,
        hasBackorders: plan.hasBackorders,
        status: fulfillment.status,
      },
      notes: `Warehouse stock allocated across ${shipmentRecords.length} warehouse(s). Backorders created: ${createdBackorders.length}`,
    });

    return { fulfillment, backorders: createdBackorders };
  }
}
