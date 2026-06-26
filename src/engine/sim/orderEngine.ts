import type { PatientSim, Order, OrderTemplate, SimEvent } from '../../types/simulation';

let _orderCounter = 0;
function nextOrderId(): string {
  return `order-${++_orderCounter}`;
}

// ─── Instantiate Order from Template ─────────────────────────────────────────

export function instantiateOrder(
  actionId: string,
  template: OrderTemplate,
  simTimeMinutes: number,
): Order {
  return {
    id: nextOrderId(),
    actionId,
    type: template.type,
    label: template.label,
    orderedAtMin: simTimeMinutes,
    arrivedAtMin: simTimeMinutes + template.timeCostMin,
    result: template.result,
    isArrived: false,
    isViewed: false,
  };
}

// ─── Resolve Arrived Orders ───────────────────────────────────────────────────
// Called every sim-minute tick. Moves orders from pending → completed when arrived.

export function resolveOrders(
  patient: PatientSim,
  events: SimEvent[],
): { patient: PatientSim; newEvents: SimEvent[] } {
  const newEvents: SimEvent[] = [];
  const stillPending: Order[] = [];
  const nowComplete: Order[]  = [...patient.completedOrders];

  for (const order of patient.pendingOrders) {
    if (patient.simTimeMinutes >= order.arrivedAtMin) {
      const arrived: Order = { ...order, isArrived: true };
      nowComplete.push(arrived);
      newEvents.push({
        simTimeMin: patient.simTimeMinutes,
        text: `📋 ${order.label} — result available`,
        severity: order.result.isAbnormal ? 'warning' : 'info',
        source: 'order-arrived',
      });
    } else {
      stillPending.push(order);
    }
  }

  return {
    patient: { ...patient, pendingOrders: stillPending, completedOrders: nowComplete },
    newEvents: [...events, ...newEvents],
  };
}

// ─── View Result ──────────────────────────────────────────────────────────────
// Called when the player opens a result in the results inbox.
// Applies hidden-vital reveals and flag changes encoded in the result.

export function viewOrderResult(
  patient: PatientSim,
  orderId: string,
  simTimeMinutes?: number,
): PatientSim {
  const order = patient.completedOrders.find(o => o.id === orderId);
  if (!order || order.isViewed) return patient;

  const updatedOrders = patient.completedOrders.map(o =>
    o.id === orderId ? { ...o, isViewed: true, viewedAtMin: simTimeMinutes } : o,
  );

  let updatedHidden = { ...patient.hiddenVitals };
  let updatedFlags  = { ...patient.flags };

  if (order.result.revealsHiddenVitals) {
    for (const [k, v] of Object.entries(order.result.revealsHiddenVitals)) {
      if (v !== undefined) updatedHidden[k] = v as number;
    }
  }
  if (order.result.setsFlags) {
    for (const f of order.result.setsFlags) updatedFlags[f] = true;
  }

  return {
    ...patient,
    completedOrders: updatedOrders,
    hiddenVitals: updatedHidden,
    flags: updatedFlags,
  };
}
