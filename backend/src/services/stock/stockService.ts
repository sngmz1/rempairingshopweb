import { db } from '../../db/database';
import { StockItem, StockMovement, UsedPart } from '../../types';

export class StockService {
  /**
   * Add stock (Stock In)
   */
  public static stockIn(params: {
    itemId: string;
    quantity: number;
    reason: string;
    userName: string;
  }): { part: StockItem; movement: StockMovement } {
    if (params.quantity <= 0) {
      throw new Error('Stock in quantity must be greater than zero');
    }

    const part = db.getPartById(params.itemId);
    if (!part) {
      throw new Error(`Part not found: ${params.itemId}`);
    }

    const beforeQuantity = part.availableQuantity;
    const afterQuantity = beforeQuantity + params.quantity;

    part.availableQuantity = afterQuantity;
    part.updatedAt = new Date().toISOString();
    db.savePart(part);

    const movement: StockMovement = {
      movementId: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: part.itemId,
      itemName: part.itemName,
      type: 'IN',
      quantity: params.quantity,
      reason: params.reason || 'Stock replenishment',
      beforeQuantity,
      afterQuantity,
      date: new Date().toISOString(),
      user: params.userName,
    };

    db.addMovement(movement);

    return { part, movement };
  }

  /**
   * Manual Stock Out (non-repair, e.g. damaged, direct sale)
   */
  public static stockOut(params: {
    itemId: string;
    quantity: number;
    reason: string;
    orderId?: string;
    userName: string;
  }): { part: StockItem; movement: StockMovement } {
    if (params.quantity <= 0) {
      throw new Error('Stock out quantity must be greater than zero');
    }

    const part = db.getPartById(params.itemId);
    if (!part) {
      throw new Error(`Part not found: ${params.itemId}`);
    }

    if (part.availableQuantity < params.quantity) {
      throw new Error(
        `Insufficient stock! Available: ${part.availableQuantity}, requested: ${params.quantity}`
      );
    }

    const beforeQuantity = part.availableQuantity;
    const afterQuantity = beforeQuantity - params.quantity;

    part.availableQuantity = afterQuantity;
    part.updatedAt = new Date().toISOString();
    db.savePart(part);

    const movement: StockMovement = {
      movementId: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: part.itemId,
      itemName: part.itemName,
      orderId: params.orderId,
      type: 'OUT',
      quantity: params.quantity,
      reason: params.reason || 'Stock out',
      beforeQuantity,
      afterQuantity,
      date: new Date().toISOString(),
      user: params.userName,
    };

    db.addMovement(movement);

    return { part, movement };
  }

  /**
   * Critical Rule 16: Consumes a part for a repair order ONLY when employee confirms "Part Used / Consumed"
   */
  public static consumeRepairPart(params: {
    orderId: string;
    partId: string;
    quantity: number;
    userName: string;
  }): { part: StockItem; movement: StockMovement } {
    const part = db.getPartById(params.partId);
    if (!part) {
      throw new Error(`Part not found: ${params.partId}`);
    }

    if (part.availableQuantity < params.quantity) {
      throw new Error(
        `Insufficient stock for ${part.itemName}! Available: ${part.availableQuantity}, required: ${params.quantity}`
      );
    }

    const beforeQuantity = part.availableQuantity;
    const afterQuantity = beforeQuantity - params.quantity;

    part.availableQuantity = afterQuantity;
    part.updatedAt = new Date().toISOString();
    db.savePart(part);

    const movement: StockMovement = {
      movementId: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: part.itemId,
      itemName: part.itemName,
      orderId: params.orderId,
      type: 'OUT',
      quantity: params.quantity,
      reason: `Used for repair order ${params.orderId}`,
      beforeQuantity,
      afterQuantity,
      date: new Date().toISOString(),
      user: params.userName,
    };

    db.addMovement(movement);

    return { part, movement };
  }

  /**
   * Critical Rule 16: Return consumed part back to inventory if unused or cancelled
   */
  public static returnRepairPart(params: {
    orderId: string;
    partId: string;
    quantity: number;
    reason?: string;
    userName: string;
  }): { part: StockItem; movement: StockMovement } {
    const part = db.getPartById(params.partId);
    if (!part) {
      throw new Error(`Part not found: ${params.partId}`);
    }

    const beforeQuantity = part.availableQuantity;
    const afterQuantity = beforeQuantity + params.quantity;

    part.availableQuantity = afterQuantity;
    part.updatedAt = new Date().toISOString();
    db.savePart(part);

    const movement: StockMovement = {
      movementId: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: part.itemId,
      itemName: part.itemName,
      orderId: params.orderId,
      type: 'RETURN',
      quantity: params.quantity,
      reason: params.reason || `Returned unused from order ${params.orderId}`,
      beforeQuantity,
      afterQuantity,
      date: new Date().toISOString(),
      user: params.userName,
    };

    db.addMovement(movement);

    return { part, movement };
  }

  /**
   * Section 17: Consumes items configured with "Consume On Delivery" (e.g. folder/box packaging)
   */
  public static consumeOnDeliveryItems(orderId: string, userName: string): StockMovement[] {
    const movements: StockMovement[] = [];
    const parts = db.getParts();
    const deliveryConsumables = parts.filter(
      (p) => p.consumptionType === 'Consume On Delivery' && p.availableQuantity > 0
    );

    // Consume 1 unit of each default delivery consumable (e.g. Repair Folder Box)
    for (const item of deliveryConsumables) {
      const beforeQuantity = item.availableQuantity;
      const afterQuantity = beforeQuantity - 1;
      item.availableQuantity = afterQuantity;
      item.updatedAt = new Date().toISOString();
      db.savePart(item);

      const movement: StockMovement = {
        movementId: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: item.itemId,
        itemName: item.itemName,
        orderId,
        type: 'OUT',
        quantity: 1,
        reason: `Auto consumed on delivery of order ${orderId}`,
        beforeQuantity,
        afterQuantity,
        date: new Date().toISOString(),
        user: userName,
      };

      db.addMovement(movement);
      movements.push(movement);
    }

    return movements;
  }
}
